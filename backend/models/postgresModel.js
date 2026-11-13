const crypto = require("node:crypto");
const { getPool } = require("../config/postgres");

const isPlainObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  !(value instanceof Date) &&
  !(value instanceof RegExp);

const clone = (value) =>
  value === undefined ? undefined : JSON.parse(JSON.stringify(value));

const getValuesAtPath = (value, path) => {
  const parts = path.split(".");
  const values = [];
  const visit = (current, index) => {
    if (index === parts.length) {
      values.push(current);
      return;
    }
    if (Array.isArray(current)) {
      current.forEach((item) => visit(item, index));
      return;
    }
    if (
      current &&
      typeof current === "object" &&
      Object.prototype.hasOwnProperty.call(current, parts[index])
    ) {
      visit(current[parts[index]], index + 1);
    }
  };
  visit(value, 0);
  return values;
};

const sameValue = (left, right) => {
  if (left instanceof Date || right instanceof Date) {
    const leftTime = new Date(left).getTime();
    const rightTime = new Date(right).getTime();
    return !Number.isNaN(leftTime) && leftTime === rightTime;
  }
  if (Array.isArray(left) && !Array.isArray(right)) {
    return left.some((value) => sameValue(value, right));
  }
  if (
    isPlainObject(left) ||
    isPlainObject(right) ||
    Array.isArray(left) ||
    Array.isArray(right)
  ) {
    return JSON.stringify(left) === JSON.stringify(right);
  }
  return left === right;
};

const compareValues = (left, right) => {
  if (left instanceof Date || right instanceof Date) {
    return new Date(left).getTime() - new Date(right).getTime();
  }
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }
  if (left === right) return 0;
  if (left === undefined || left === null) return -1;
  if (right === undefined || right === null) return 1;
  return String(left).localeCompare(String(right));
};

const matchesRegex = (value, expression, options = "") => {
  if (Array.isArray(value)) {
    return value.some((item) => matchesRegex(item, expression, options));
  }
  if (typeof value !== "string") return false;
  const regex =
    expression instanceof RegExp
      ? new RegExp(expression.source, expression.flags)
      : new RegExp(String(expression), options);
  regex.lastIndex = 0;
  return regex.test(value);
};

const matchesCondition = (values, condition) => {
  const exists = values.length > 0;
  if (condition instanceof RegExp) {
    return values.some((value) => matchesRegex(value, condition));
  }
  if (
    !isPlainObject(condition) ||
    !Object.keys(condition).some((key) => key.startsWith("$"))
  ) {
    if (condition === null && !exists) return true;
    return values.some((value) => sameValue(value, condition));
  }

  return Object.entries(condition).every(([operator, expected]) => {
    if (operator === "$options") return true;
    if (operator === "$exists") return Boolean(expected) === exists;
    if (operator === "$regex") {
      return values.some((value) =>
        matchesRegex(value, expected, condition.$options || "")
      );
    }
    if (operator === "$in") {
      return values.some((value) =>
        expected.some((candidate) =>
          candidate instanceof RegExp
            ? matchesRegex(value, candidate)
            : sameValue(value, candidate)
        )
      );
    }
    if (operator === "$nin") {
      return !values.some((value) =>
        expected.some((candidate) => sameValue(value, candidate))
      );
    }
    if (operator === "$ne") {
      return condition.$ne === null
        ? exists && !values.some((value) => value === null)
        : !values.some((value) => sameValue(value, expected));
    }
    if (operator === "$gt") {
      return values.some((value) => compareValues(value, expected) > 0);
    }
    if (operator === "$gte") {
      return values.some((value) => compareValues(value, expected) >= 0);
    }
    if (operator === "$lt") {
      return values.some((value) => compareValues(value, expected) < 0);
    }
    if (operator === "$lte") {
      return values.some((value) => compareValues(value, expected) <= 0);
    }
    return false;
  });
};

const matchesQuery = (document, query = {}) =>
  Object.entries(query).every(([field, condition]) => {
    if (field === "$or") {
      return condition.some((item) => matchesQuery(document, item));
    }
    if (field === "$and") {
      return condition.every((item) => matchesQuery(document, item));
    }
    if (field === "$nor") {
      return !condition.some((item) => matchesQuery(document, item));
    }
    return matchesCondition(getValuesAtPath(document, field), condition);
  });

const setPath = (target, path, value) => {
  const parts = path.split(".");
  let current = target;
  for (const part of parts.slice(0, -1)) {
    if (!isPlainObject(current[part])) current[part] = {};
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
};

const unsetPath = (target, path) => {
  const parts = path.split(".");
  let current = target;
  for (const part of parts.slice(0, -1)) {
    current = current && current[part];
    if (!current) return;
  }
  if (current) delete current[parts[parts.length - 1]];
};

const applyUpdate = (document, update, inserting = false) => {
  const operators = Object.keys(update).some((key) => key.startsWith("$"));
  if (!operators) {
    for (const [field, value] of Object.entries(update)) {
      setPath(document, field, clone(value));
    }
    return document;
  }

  for (const [field, value] of Object.entries(update.$set || {})) {
    setPath(document, field, clone(value));
  }
  if (inserting) {
    for (const [field, value] of Object.entries(update.$setOnInsert || {})) {
      if (getValuesAtPath(document, field).length === 0) {
        setPath(document, field, clone(value));
      }
    }
  }
  for (const [field, amount] of Object.entries(update.$inc || {})) {
    const current = getValuesAtPath(document, field)[0] || 0;
    setPath(document, field, Number(current) + Number(amount));
  }
  for (const [field, value] of Object.entries(update.$push || {})) {
    const current = getValuesAtPath(document, field)[0];
    const items = value && Array.isArray(value.$each) ? value.$each : [value];
    const next = [...(Array.isArray(current) ? current : []), ...clone(items)];
    if (value && Number.isInteger(value.$slice)) {
      const start = value.$slice < 0 ? Math.max(0, next.length + value.$slice) : 0;
      const end = value.$slice < 0 ? undefined : value.$slice;
      setPath(document, field, next.slice(start, end));
    } else {
      setPath(document, field, next);
    }
  }
  for (const [field, value] of Object.entries(update.$addToSet || {})) {
    const current = getValuesAtPath(document, field)[0];
    const items = value && Array.isArray(value.$each) ? value.$each : [value];
    const next = Array.isArray(current) ? [...current] : [];
    for (const item of items) {
      if (!next.some((existing) => sameValue(existing, item))) next.push(clone(item));
    }
    setPath(document, field, next);
  }
  for (const field of Object.keys(update.$unset || {})) {
    unsetPath(document, field);
  }
  return document;
};

const addSubdocumentIds = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (!isPlainObject(item)) return item;
      const nested = addSubdocumentIds(item);
      if (!nested._id) nested._id = crypto.randomUUID();
      return nested;
    });
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, addSubdocumentIds(item)])
    );
  }
  return value;
};

const extractEqualities = (query) => {
  const values = {};
  for (const [field, condition] of Object.entries(query || {})) {
    if (field.startsWith("$")) continue;
    if (
      !isPlainObject(condition) ||
      !Object.keys(condition).some((key) => key.startsWith("$"))
    ) {
      setPath(values, field, clone(condition));
    }
  }
  return values;
};

const serializeQueryValue = (value) =>
  value instanceof Date
    ? value.toISOString()
    : Array.isArray(value)
      ? value.map(serializeQueryValue)
      : value;

const fieldExpressions = (field) => {
  if (field === "_id") {
    return { json: "document -> '_id'", text: "document ->> '_id'", type: "text" };
  }
  if (field === "createdAt") {
    return {
      json: "document -> 'createdAt'",
      text: "created_at",
      type: "timestamp",
    };
  }
  if (field === "updatedAt") {
    return {
      json: "document -> 'updatedAt'",
      text: "updated_at",
      type: "timestamp",
    };
  }
  if (field === "expiresAt") {
    return {
      json: "document -> 'expiresAt'",
      text: "expires_at",
      type: "timestamp",
    };
  }
  const parts = field.split(".");
  if (
    parts.length !== 1 ||
    parts.some((part) => !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(part)) ||
    parts[0] === "messages"
  ) {
    return null;
  }
  const fieldName = parts[0];
  return {
    json: `document -> '${fieldName}'`,
    text: `document ->> '${fieldName}'`,
    type: "json",
  };
};

const compileQuery = (query, parameters = []) => {
  const compile = (filter) => {
    const clauses = [];
    for (const [field, condition] of Object.entries(filter || {})) {
      if (field === "$or" || field === "$and" || field === "$nor") {
        const branches = condition.map((item) => compile(item));
        if (branches.some((branch) => branch === null)) return null;
        const joiner = field === "$and" ? " AND " : " OR ";
        const expression = branches.length
          ? branches.map((branch) => `(${branch})`).join(joiner)
          : field === "$and"
            ? "TRUE"
            : "FALSE";
        clauses.push(
          field === "$nor" ? `NOT (${expression})` : `(${expression})`
        );
        continue;
      }

      const expressions = fieldExpressions(field);
      if (!expressions) return null;
      const bind = (value, type = "jsonb") => {
        parameters.push(
          type === "jsonb"
            ? JSON.stringify(serializeQueryValue(value))
            : serializeQueryValue(value)
        );
        return `$${parameters.length}${type === "jsonb" ? "::jsonb" : `::${type}`}`;
      };
      const equality = (value) => {
        if (value === null) {
          return `(${expressions.json} IS NULL OR ${expressions.json} = 'null'::jsonb)`;
        }
        const parameter = bind(value);
        return `${expressions.json} = ${parameter}`;
      };
      const comparison = (operator, value) => {
        let left = expressions.text;
        let right;
        if (value instanceof Date || expressions.type === "timestamp") {
          left =
            expressions.type === "timestamp"
              ? expressions.text
              : `NULLIF(NULLIF(${expressions.text}, 'null'), '')::timestamptz`;
          right = bind(value, "timestamptz");
        } else if (typeof value === "number") {
          left = `NULLIF(NULLIF(${expressions.text}, 'null'), '')::numeric`;
          right = bind(value, "numeric");
        } else {
          right = bind(value, "text");
        }
        return `COALESCE(${left} ${operator} ${right}, FALSE)`;
      };

      if (condition instanceof RegExp) {
        return null;
      }

      if (
        !isPlainObject(condition) ||
        !Object.keys(condition).some((key) => key.startsWith("$"))
      ) {
        clauses.push(equality(condition));
        continue;
      }

      const operations = [];
      for (const [operator, expected] of Object.entries(condition)) {
        if (operator === "$options") continue;
        if (operator === "$exists") {
          operations.push(
            expected ? `${expressions.json} IS NOT NULL` : `${expressions.json} IS NULL`
          );
        } else if (operator === "$regex") {
          return null;
        } else if (operator === "$in" || operator === "$nin") {
          if (!Array.isArray(expected)) return null;
          const alternatives = expected.map((value) =>
            value instanceof RegExp ? null : equality(value)
          );
          if (alternatives.some((item) => item === null)) return null;
          const includes = alternatives.length
            ? alternatives.map((item) => `(${item})`).join(" OR ")
            : "FALSE";
          operations.push(
            operator === "$in"
              ? `(${includes})`
              : `NOT COALESCE((${includes}), FALSE)`
          );
        } else if (operator === "$ne") {
          operations.push(
            expected === null
              ? `(${expressions.json} IS NOT NULL AND ${expressions.json} <> 'null'::jsonb)`
              : `NOT COALESCE(${equality(expected)}, FALSE)`
          );
        } else if (operator === "$gt") {
          operations.push(comparison(">", expected));
        } else if (operator === "$gte") {
          operations.push(comparison(">=", expected));
        } else if (operator === "$lt") {
          operations.push(comparison("<", expected));
        } else if (operator === "$lte") {
          operations.push(comparison("<=", expected));
        } else {
          return null;
        }
      }
      clauses.push(operations.length ? operations.join(" AND ") : "TRUE");
    }
    return clauses.length ? clauses.join(" AND ") : "TRUE";
  };

  const where = compile(query);
  return where === null ? null : { where, parameters };
};

const createValidationError = (message) => {
  const error = new Error(message);
  error.name = "ValidationError";
  return error;
};

const requireFields = (document, fields) => {
  const missing = fields.filter(
    (field) =>
      document[field] === undefined ||
      document[field] === null ||
      (typeof document[field] === "string" && !document[field].trim())
  );
  if (missing.length > 0) {
    throw createValidationError(
      `${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} required`
    );
  }
};

const projectDocument = (document, selection, hiddenFields) => {
  const result = clone(document);
  const tokens =
    typeof selection === "string"
      ? selection.trim().split(/\s+/).filter(Boolean)
      : [];
  const includes = tokens.filter(
    (token) => !token.startsWith("-") && !token.startsWith("+")
  );
  const explicitHidden = new Set(
    tokens.filter((token) => token.startsWith("+")).map((token) => token.slice(1))
  );
  if (includes.length > 0) {
    const projected = { _id: result._id };
    for (const field of includes) {
      if (!hiddenFields.includes(field) || explicitHidden.has(field)) {
        const values = getValuesAtPath(result, field);
        if (values.length > 0) setPath(projected, field, values[0]);
      }
    }
    for (const field of explicitHidden) {
      const values = getValuesAtPath(result, field);
      if (values.length > 0) setPath(projected, field, values[0]);
    }
    return projected;
  }
  for (const token of tokens.filter((item) => item.startsWith("-"))) {
    unsetPath(result, token.slice(1));
  }
  for (const field of hiddenFields) {
    if (!explicitHidden.has(field)) unsetPath(result, field);
  }
  for (const field of explicitHidden) {
    const values = getValuesAtPath(document, field);
    if (values.length > 0) setPath(result, field, values[0]);
  }
  return result;
};

const normalizeDatabaseError = (error) => {
  if (error && error.code === "23505") {
    error.code = 11000;
  }
  return error;
};

class ModelDocument {
  constructor(model, data) {
    Object.assign(this, clone(data));
    Object.defineProperties(this, {
      _model: { value: model },
      save: {
        value: async () => {
          Object.assign(this, await model._replaceById(this._id, this.toObject()));
          return this;
        },
      },
      toObject: {
        value: () =>
          Object.fromEntries(
            Object.entries(this)
              .filter(([key]) => key !== "_model")
              .map(([key, value]) => [key, clone(value)])
          ),
      },
      toJSON: {
        value: () => this.toObject(),
      },
    });
  }
}

class ModelQuery {
  constructor(model, executor) {
    this.model = model;
    this.executor = executor;
    this.sortSpec = null;
    this.skipCount = 0;
    this.limitCount = null;
    this.selection = null;
    this.asLean = false;
    this.promise = null;
  }

  sort(specification) {
    this.sortSpec = specification;
    return this;
  }

  skip(count) {
    this.skipCount = Math.max(0, Number(count) || 0);
    return this;
  }

  limit(count) {
    this.limitCount = Math.max(0, Number(count) || 0);
    return this;
  }

  select(selection) {
    this.selection = selection;
    return this;
  }

  lean() {
    this.asLean = true;
    return this;
  }

  async execute() {
    if (!this.promise) {
      this.promise = Promise.resolve().then(this.executor).then((value) => {
        const convert = (document) => {
          if (!document) return null;
          const projected = projectDocument(
            document,
            this.selection,
            this.model.hiddenFields
          );
          return this.asLean ? projected : new ModelDocument(this.model, projected);
        };
        if (!Array.isArray(value)) return convert(value);
        let results = value;
        if (this.sortSpec) {
          const entries = Object.entries(this.sortSpec);
          results = [...results].sort((left, right) => {
            for (const [field, direction] of entries) {
              const comparison = compareValues(
                getValuesAtPath(left, field)[0],
                getValuesAtPath(right, field)[0]
              );
              if (comparison !== 0) return comparison * (direction < 0 ? -1 : 1);
            }
            return 0;
          });
        }
        if (this.skipCount) results = results.slice(this.skipCount);
        if (this.limitCount) results = results.slice(0, this.limitCount);
        return results.map(convert);
      });
    }
    return this.promise;
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  catch(reject) {
    return this.execute().catch(reject);
  }

  finally(callback) {
    return this.execute().finally(callback);
  }
}

const createModel = ({
  tableName,
  defaults = {},
  hiddenFields = [],
  timestamps = true,
  normalize = (document) => document,
  validate = () => {},
}) => {
  if (!/^[a-z][a-z0-9_]*$/.test(tableName)) {
    throw new Error(`Invalid PostgreSQL table name: ${tableName}`);
  }

  const buildDocument = (input = {}) => {
    const now = new Date().toISOString();
    const document = {
      ...clone(defaults),
      ...clone(input),
      _id: input._id || crypto.randomUUID(),
    };
    if (timestamps) {
      document.createdAt = document.createdAt || now;
      document.updatedAt = document.updatedAt || now;
    } else if (document.createdAt === undefined) {
      document.createdAt = now;
    }
    normalize(document);
    for (const [key, value] of Object.entries(document)) {
      document[key] = addSubdocumentIds(value);
    }
    validateDocument(document);
    return document;
  };
  const validateDocument = (document) => {
    try {
      validate(document);
    } catch (error) {
      if (error.name === "Error") error.name = "ValidationError";
      throw error;
    }
  };

  const writeDocument = async (client, document, insert = false) => {
    const id = document._id;
    const createdAt = document.createdAt || new Date().toISOString();
    const updatedAt = timestamps ? document.updatedAt || createdAt : null;
    const expiresAt = document.expiresAt || null;
    const query = insert
      ? `INSERT INTO ${tableName} (id, document, created_at, updated_at, expires_at)
         VALUES ($1::uuid, $2::jsonb, $3::timestamptz, $4::timestamptz, $5::timestamptz)`
      : `UPDATE ${tableName}
         SET document = $2::jsonb, created_at = $3::timestamptz,
             updated_at = $4::timestamptz, expires_at = $5::timestamptz
         WHERE id = $1::uuid`;
    await client.query(query, [
      id,
      JSON.stringify(document),
      createdAt,
      updatedAt,
      expiresAt,
    ]);
  };

  const model = {
    tableName,
    hiddenFields,
    find(query = {}) {
      return new ModelQuery(model, () => model._findMatching(query));
    },
    findOne(query = {}) {
      return new ModelQuery(
        model,
        async () => (await model._findMatching(query))[0] || null
      );
    },
    findById(id) {
      return model.findOne({ _id: String(id) });
    },
    findByIdAndUpdate(id, update, options = {}) {
      return model.findOneAndUpdate({ _id: String(id) }, update, options);
    },
    findOneAndUpdate(query, update, options = {}) {
      return new ModelQuery(model, () => model._mutateOne(query, update, options));
    },
    findByIdAndDelete(id) {
      return model.findOneAndDelete({ _id: String(id) });
    },
    findOneAndDelete(query) {
      return new ModelQuery(model, () => model._deleteOne(query));
    },
    async create(input) {
      if (Array.isArray(input)) {
        return Promise.all(input.map((item) => model.create(item)));
      }
      const document = buildDocument(input);
      try {
        await writeDocument(getPool(), document, true);
      } catch (error) {
        throw normalizeDatabaseError(error);
      }
      return new ModelDocument(model, document);
    },
    async countDocuments(query = {}) {
      const compiled = compileQuery(query);
      if (compiled) {
        const { rows } = await getPool().query(
          `SELECT COUNT(*)::int AS count FROM ${tableName} WHERE ${compiled.where}`,
          compiled.parameters
        );
        return Number(rows[0].count);
      }
      return (await model._findMatching(query)).length;
    },
    async exists(query = {}) {
      const document = (await model._findMatching(query))[0];
      return document ? { _id: document._id } : null;
    },
    async distinct(field) {
      const values = (await model._findAll()).flatMap((document) =>
        getValuesAtPath(document, field)
      );
      return [...new Map(values.map((value) => [JSON.stringify(value), value])).values()];
    },
    async updateOne(query, update, options = {}) {
      return model._mutateOne(query, update, { ...options, resultOnly: true });
    },
    async deleteMany(query = {}) {
      const rows = await model._findMatching(query);
      const client = getPool();
      for (const document of rows) {
        await client.query(`DELETE FROM ${tableName} WHERE id = $1::uuid`, [
          document._id,
        ]);
      }
      return { acknowledged: true, deletedCount: rows.length };
    },
    async _findAll(client = getPool()) {
      const { rows } = await client.query(`SELECT document FROM ${tableName}`);
      return rows.map((row) =>
        typeof row.document === "string" ? JSON.parse(row.document) : row.document
      );
    },
    async _findMatching(query = {}) {
      const compiled = compileQuery(query);
      const { rows } = compiled
        ? await getPool().query(
            `SELECT document FROM ${tableName} WHERE ${compiled.where}`,
            compiled.parameters
          )
        : await getPool().query(`SELECT document FROM ${tableName}`);
      const documents = rows.map((row) =>
        typeof row.document === "string" ? JSON.parse(row.document) : row.document
      );
      return documents.filter((document) => matchesQuery(document, query));
    },
    async _replaceById(id, input) {
      const document = buildDocument({ ...input, _id: String(id) });
      if (timestamps) document.updatedAt = new Date().toISOString();
      try {
        await writeDocument(getPool(), document, false);
      } catch (error) {
        throw normalizeDatabaseError(error);
      }
      return document;
    },
    async _mutateOne(query, update, options) {
      const pool = getPool();
      const client = await pool.connect();
      let output;
      try {
        await client.query("BEGIN");
        const compiled = compileQuery(query);
        const rows = compiled
          ? await client.query(
              `SELECT document FROM ${tableName} WHERE ${compiled.where} FOR UPDATE`,
              compiled.parameters
            )
          : await client.query(`SELECT document FROM ${tableName} FOR UPDATE`);
        const documents = rows.rows.map((row) =>
          typeof row.document === "string" ? JSON.parse(row.document) : row.document
        );
        const existing = documents.find((document) => matchesQuery(document, query));

        if (!existing && !options.upsert) {
          await client.query("COMMIT");
          return options.resultOnly
            ? { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 0 }
            : null;
        }

        if (!existing) {
          const inserted = buildDocument(extractEqualities(query));
          applyUpdate(inserted, update, true);
          for (const [field, value] of Object.entries(inserted)) {
            inserted[field] = addSubdocumentIds(value);
          }
          inserted.updatedAt = timestamps ? new Date().toISOString() : undefined;
          validateDocument(inserted);
          await writeDocument(client, inserted, true);
          output = options.resultOnly
            ? {
                acknowledged: true,
                matchedCount: 0,
                modifiedCount: 0,
                upsertedCount: 1,
                upsertedId: inserted._id,
              }
            : inserted;
        } else {
          const before = clone(existing);
          const changed = applyUpdate(clone(existing), update);
          changed._id = existing._id;
          for (const [field, value] of Object.entries(changed)) {
            changed[field] = addSubdocumentIds(value);
          }
          if (timestamps) changed.updatedAt = new Date().toISOString();
          validateDocument(changed);
          await writeDocument(client, changed, false);
          const useAfter =
            options.returnDocument === "after" ||
            options.new === true;
          output = options.resultOnly
            ? { acknowledged: true, matchedCount: 1, modifiedCount: 1, upsertedCount: 0 }
            : useAfter
              ? changed
              : before;
        }
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw normalizeDatabaseError(error);
      } finally {
        client.release();
      }

      return output;
    },
    async _deleteOne(query) {
      const rows = await model._findMatching(query);
      const document = rows[0];
      if (!document) return null;
      await getPool().query(`DELETE FROM ${tableName} WHERE id = $1::uuid`, [
        document._id,
      ]);
      return document;
    },
  };

  return model;
};

module.exports = {
  compileQuery,
  createValidationError,
  createModel,
  isValidRecordId: (value) =>
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    ),
  requireFields,
};
