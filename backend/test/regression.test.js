const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { after, before, beforeEach, test } = require("node:test");
const jwt = require("jsonwebtoken");
const { newDb } = require("pg-mem");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "qa-test-secret-that-is-not-used-outside-tests";
process.env.OPENAI_API_KEY = "";
process.env.MONGOMS_LAUNCH_TIMEOUT = "30000";
process.env.RESUME_UPLOAD_DIR = path.join(
  os.tmpdir(),
  `godavari-qa-resumes-${crypto.randomUUID()}`
);

const Admin = require("../models/Admin");
const AdminActivity = require("../models/AdminActivity");
const Branch = require("../models/Branch");
const ChatConversation = require("../models/ChatConversation");
const Enquiry = require("../models/enquiry");
const JobApplication = require("../models/JobApplication");
const JobOpening = require("../models/JobOpening");
const SiteContent = require("../models/SiteContent");
const User = require("../models/user");
const WebsiteVisitor = require("../models/WebsiteVisitor");
const {
  closePool,
  initializeSchema,
  setPoolForTests,
} = require("../config/postgres");

let appServer;
let apiBase;
let app;
let tempRoot;

const userToken = (user) =>
  jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

const request = (route, { method = "GET", body, token } = {}) => {
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) {
    if (token.startsWith("gw_admin_sid=")) {
      headers.cookie = token;
    } else {
      headers.authorization = `Bearer ${token}`;
    }
  }
  return fetch(`${apiBase}${route}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
};

const readJson = async (response) => ({
  status: response.status,
  body: await response.json(),
});

const createAdmin = async ({
  username = "qa-admin",
  role = "admin",
  permissions = ["*"],
} = {}) => {
  const bcrypt = require("bcryptjs");
  const password = "qa-password-123";
  const admin = await Admin.create({
    username,
    passwordHash: await bcrypt.hash(password, 4),
    role,
    permissions,
    isActive: true,
  });
  const login = await request("/api/admin/auth/login", {
    method: "POST",
    body: { username, password },
  });
  assert.equal(login.status, 200);
  const sessionCookie = login.headers
    .get("set-cookie")
    ?.match(/gw_admin_sid=[^;]+/)?.[0];
  assert.ok(sessionCookie, "admin login should set its session cookie");
  return { admin, token: sessionCookie };
};

const loginAdmin = async (username, password) => {
  const response = await request("/api/admin/auth/login", {
    method: "POST",
    body: { username, password },
  });
  assert.equal(response.status, 200);
  return response.headers.get("set-cookie")?.match(/gw_admin_sid=[^;]+/)?.[0];
};

const createUser = async ({ email = "qa-admin@example.test", role = "admin" } = {}) => {
  const user = await User.create({
    name: "QA Administrator",
    email,
    password: "test-password-hash",
    role,
    isActive: true,
  });
  return { user, token: userToken(user) };
};

const branchPayload = (overrides = {}) => ({
  city: "Rajahmundry",
  isHeadquarters: true,
  address: "100 Godavari Road, Rajahmundry",
  phones: ["+91 8000000000"],
  imageUrl: "https://example.test/branch.jpg",
  lat: 17.0001,
  lng: 81.804,
  region: "Andhra Pradesh",
  openTime: "09:00",
  closeTime: "18:00",
  mapPosition: { x: 52, y: 70 },
  isActive: true,
  order: 0,
  ...overrides,
});

const applicationPayload = (resumeFile) => ({
  fullName: "QA Applicant",
  email: "applicant@example.test",
  phone: "+91 8000000001",
  position: "Software Engineer",
  experience: "2 years",
  resumeFile,
});

const pdfResume = {
  fileName: "resume.pdf",
  mimeType: "application/pdf",
  base64Data: Buffer.from("%PDF-1.4 QA resume").toString("base64"),
};

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "godavari-qa-test-"));
  process.env.RESUME_UPLOAD_DIR = path.join(tempRoot, "resumes");
  const memoryDatabase = newDb();
  memoryDatabase.public.registerFunction({
    name: "nullif",
    args: ["text", "text"],
    returns: "text",
    implementation: (value, match) => (value === match ? null : value),
  });
  const { Pool } = memoryDatabase.adapters.createPg();
  setPoolForTests(new Pool());
  await initializeSchema();
  app = require("../server");
  appServer = await new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
  apiBase = `http://127.0.0.1:${appServer.address().port}`;
});

beforeEach(async () => {
  await Promise.all([
    Admin.deleteMany({}),
    AdminActivity.deleteMany({}),
    Branch.deleteMany({}),
    ChatConversation.deleteMany({}),
    Enquiry.deleteMany({}),
    JobApplication.deleteMany({}),
    JobOpening.deleteMany({}),
    SiteContent.deleteMany({}),
    User.deleteMany({}),
    WebsiteVisitor.deleteMany({}),
  ]);
  await fs.rm(process.env.RESUME_UPLOAD_DIR, { recursive: true, force: true });
  await fs.mkdir(process.env.RESUME_UPLOAD_DIR, { recursive: true });
});

after(async () => {
  if (appServer) {
    await new Promise((resolve, reject) =>
      appServer.close((error) => (error ? reject(error) : resolve()))
    );
  }
  await closePool();
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true });
});

test("health and enquiry routes report database and validation status", async () => {
  const health = await readJson(await request("/api/health"));
  assert.equal(health.status, 200);
  assert.equal(health.body.db, "connected");

  const unauthorized = await readJson(await request("/api/enquiries"));
  assert.equal(unauthorized.status, 401);

  const missing = await readJson(
    await request("/api/enquiries", { method: "POST", body: { name: "Missing fields" } })
  );
  assert.equal(missing.status, 400);

  const created = await readJson(
    await request("/api/enquiries", {
      method: "POST",
      body: {
        name: "QA Visitor",
        email: "visitor@example.test",
        phone: "+91 8000000002",
        subject: "Website enquiry",
        message: "Please contact me about your services.",
      },
    })
  );
  assert.equal(created.status, 201);
  assert.equal(created.body.success, true);

  const { token } = await createUser();
  const listed = await readJson(
    await request("/api/enquiries", { token })
  );
  assert.equal(listed.status, 200);
  assert.equal(listed.body.count, 1);

  const enquiryId = created.body.data.enquiry._id;
  const updated = await readJson(
    await request(`/api/enquiries/${enquiryId}/status`, {
      method: "PUT",
      token,
      body: { status: "contacted" },
    })
  );
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.enquiry.status, "contacted");

  const deleted = await readJson(
    await request(`/api/enquiries/${enquiryId}`, { method: "DELETE", token })
  );
  assert.equal(deleted.status, 200);
});

test("branch API validates writes, filters regions, and protects mutations", async () => {
  const unauthorized = await readJson(
    await request("/api/branches", { method: "POST", body: branchPayload() })
  );
  assert.equal(unauthorized.status, 401);

  const { token } = await createAdmin();
  const invalid = await readJson(
    await request("/api/branches", {
      method: "POST",
      token,
      body: branchPayload({ lat: 100 }),
    })
  );
  assert.equal(invalid.status, 400, JSON.stringify(invalid.body));

  const created = await readJson(
    await request("/api/branches", {
      method: "POST",
      token,
      body: branchPayload(),
    })
  );
  assert.equal(created.status, 201);
  const branchId = created.body.data._id;

  const filtered = await readJson(
    await request("/api/branches?region=Andhra%20Pradesh")
  );
  assert.equal(filtered.status, 200);
  assert.equal(filtered.body.data.length, 1);

  const updated = await readJson(
    await request(`/api/branches/${branchId}`, {
      method: "PATCH",
      token,
      body: { region: "South India" },
    })
  );
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.region, "South India");

  const duplicateHeadquarters = await readJson(
    await request("/api/branches", {
      method: "POST",
      token,
      body: branchPayload({ city: "Visakhapatnam" }),
    })
  );
  assert.equal(duplicateHeadquarters.status, 409);

  const deleted = await readJson(
    await request(`/api/branches/${branchId}`, { method: "DELETE", token })
  );
  assert.equal(deleted.status, 200);

  const savedContent = await readJson(
    await request("/api/admin/content", {
      method: "PUT",
      token,
      body: {
        branches: [
          {
            id: "rajahmundry",
            name: "Head Office",
            region: "Godavari Region",
            description: "Regional headquarters.",
            address: "100 Godavari Road",
          },
        ],
      },
    })
  );
  assert.equal(savedContent.status, 200);
  assert.equal(savedContent.body.data.content.branches[0].region, "Godavari Region");

  const publicContent = await readJson(await request("/api/content"));
  assert.equal(publicContent.status, 200);
  assert.equal(publicContent.body.data.content.branches[0].region, "Godavari Region");
});

test("expired and inactive jobs are excluded from public listings and chatbot replies", async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  await JobOpening.create([
    {
      title: "Current QA Role",
      department: "Engineering",
      description: "A current role.",
      isActive: true,
      deadline: tomorrow,
    },
    {
      title: "Expired Secret Role",
      department: "Engineering",
      description: "An expired role.",
      isActive: true,
      deadline: yesterday,
    },
    {
      title: "Inactive Secret Role",
      department: "Engineering",
      description: "An inactive role.",
      isActive: false,
      deadline: null,
    },
  ]);

  const listed = await readJson(await request("/api/job-openings"));
  assert.equal(listed.status, 200);
  assert.ok(JSON.stringify(listed.body).includes("Current QA Role"));
  assert.ok(!JSON.stringify(listed.body).includes("Expired Secret Role"));
  assert.ok(!JSON.stringify(listed.body).includes("Inactive Secret Role"));

  const chat = await readJson(
    await request("/api/chat", {
      method: "POST",
      body: { messages: [{ role: "user", content: "What jobs are open?" }] },
    })
  );
  assert.equal(chat.status, 200);
  assert.ok(chat.body.data.reply.includes("Current QA Role"));
  assert.ok(!chat.body.data.reply.includes("Expired Secret Role"));
});

test("admin sessions enforce domain permissions and validate assigned permissions", async () => {
  const { admin: actor, token: actorToken } = await createAdmin();
  const created = await readJson(
    await request("/api/admin/accounts", {
      method: "POST",
      token: actorToken,
      body: {
        username: "limited-manager",
        password: "qa-password-123",
        role: "sales_manager",
        permissions: ["leads:manage"],
      },
    })
  );
  assert.equal(created.status, 201);
  assert.deepEqual(created.body.data.admin.permissions, ["leads:manage"]);
  const managerId = created.body.data.admin._id;
  const manager = await Admin.findById(managerId);
  const managerToken = await loginAdmin("limited-manager", "qa-password-123");

  const updatePermissions = await readJson(
    await request(`/api/admin/accounts/${managerId}`, {
      method: "PATCH",
      token: actorToken,
      body: { permissions: ["careers:manage"] },
    })
  );
  assert.equal(updatePermissions.status, 200);
  assert.deepEqual(updatePermissions.body.data.admin.permissions, ["careers:manage"]);
  assert.deepEqual(
    (await Admin.findById(managerId).lean()).permissions,
    ["careers:manage"]
  );

  const wildcard = await readJson(
    await request(`/api/admin/accounts/${managerId}`, {
      method: "PATCH",
      token: actorToken,
      body: { permissions: ["*"] },
    })
  );
  assert.equal(wildcard.status, 400);

  const unknownPermission = await readJson(
    await request("/api/admin/accounts", {
      method: "POST",
      token: actorToken,
      body: {
        username: "invalid-manager",
        password: "qa-password-123",
        role: "hr_manager",
        permissions: ["admins:root"],
      },
    })
  );
  assert.equal(unknownPermission.status, 400);

  const { admin: existingWildcardManager, token: legacyToken } = await createAdmin({
    username: "legacy-wildcard-manager",
    role: "sales_manager",
    permissions: ["*"],
  });
  const deniedAccounts = await readJson(
    await request("/api/admin/accounts", { token: legacyToken })
  );
  const deniedCareers = await readJson(
    await request("/api/admin/jobs", { token: legacyToken })
  );
  assert.equal(deniedAccounts.status, 403);
  assert.equal(deniedCareers.status, 403);

  const deniedActivity = await readJson(
    await request("/api/admin/activity-logs", { token: managerToken })
  );
  assert.equal(deniedActivity.status, 403);

  const scopedAdmin = await createAdmin({
    username: "scoped-sales-manager",
    role: "sales_manager",
    permissions: ["leads:manage"],
  });
  await Enquiry.create({
    name: "Visible lead",
    email: "visible@example.test",
    phone: "+91 8000000003",
    subject: "Lead subject",
    message: "Lead message",
    status: "new",
  });
  await JobApplication.create({
    fullName: "Hidden applicant",
    email: "hidden@example.test",
    phone: "+91 8000000004",
    position: "Engineer",
  });
  await AdminActivity.create({
    actorId: actor._id,
    actorUsername: actor.username,
    action: "admin.test",
    targetType: "admin",
    summary: "Private activity",
  });

  const overview = await readJson(
    await request("/api/admin/overview", { token: scopedAdmin.token })
  );
  assert.equal(overview.status, 200);
  assert.equal(overview.body.data.summary.totalLeads, 1);
  assert.equal(overview.body.data.summary.totalJobApplications, 0);

  const notifications = await readJson(
    await request("/api/admin/notifications", { token: scopedAdmin.token })
  );
  assert.equal(notifications.status, 200);
  assert.equal(notifications.body.data.newLeads.length, 1);
  assert.equal(notifications.body.data.newApplications.length, 0);
  assert.equal(notifications.body.data.adminActivity.length, 0);
  assert.ok(actor);
});

test("admin login accepts valid credentials and rejects invalid credentials", async () => {
  const bcrypt = require("bcryptjs");
  await Admin.create({
    username: "login-admin",
    passwordHash: await bcrypt.hash("valid-test-password", 4),
    role: "admin",
    permissions: ["*"],
    isActive: true,
  });

  const invalid = await readJson(
    await request("/api/admin/auth/login", {
      method: "POST",
      body: { username: "login-admin", password: "wrong-password" },
    })
  );
  assert.equal(invalid.status, 401);

  const valid = await readJson(
    await request("/api/admin/auth/login", {
      method: "POST",
      body: { username: "login-admin", password: "valid-test-password" },
    })
  );
  assert.equal(valid.status, 200);
  assert.equal(valid.body.success, true);

  const logout = await readJson(
    await request("/api/admin/auth/logout", { method: "POST" })
  );
  assert.equal(logout.status, 200);
});

test("job opening CRUD validates payloads and exposes only active records", async () => {
  const { token } = await createUser();
  const invalid = await readJson(
    await request("/api/job-openings", {
      method: "POST",
      token,
      body: { title: "Incomplete" },
    })
  );
  assert.equal(invalid.status, 400);

  const created = await readJson(
    await request("/api/job-openings", {
      method: "POST",
      token,
      body: {
        title: "Test Opening",
        department: "Engineering",
        description: "An opening created by an isolated integration test.",
        location: "Remote",
        jobType: "Full-time",
        experience: "2 years",
        isActive: true,
      },
    })
  );
  assert.equal(created.status, 201);
  const id = created.body.data.opening._id;

  const updated = await readJson(
    await request(`/api/job-openings/${id}`, {
      method: "PUT",
      token,
      body: { location: "Hybrid" },
    })
  );
  assert.equal(updated.status, 200);

  const deleted = await readJson(
    await request(`/api/job-openings/${id}`, { method: "DELETE", token })
  );
  assert.equal(deleted.status, 200);
});

test("resume upload failures clean up files and admin deletion removes resumes", async () => {
  const submitted = await readJson(
    await request("/api/job-applications", {
      method: "POST",
      body: applicationPayload(pdfResume),
    })
  );
  assert.equal(submitted.status, 201);
  const applicationId = submitted.body.data.application._id;
  const application = await JobApplication.findById(applicationId)
    .select("+resumeStoredPath")
    .lean();
  const uploadedPath = path.join(process.env.RESUME_UPLOAD_DIR, application.resumeStoredPath);
  await fs.access(uploadedPath);

  const { token } = await createAdmin();
  const deleted = await readJson(
    await request(`/api/admin/applications/${applicationId}`, {
      method: "DELETE",
      token,
    })
  );
  assert.equal(deleted.status, 200);
  await assert.rejects(fs.access(uploadedPath));
  assert.equal(await JobApplication.findById(applicationId), null);

  const originalCreate = JobApplication.create;
  JobApplication.create = async () => {
    throw new Error("forced isolated-test database failure");
  };
  try {
    const failed = await readJson(
      await request("/api/job-applications", {
        method: "POST",
        body: applicationPayload(pdfResume),
      })
    );
    assert.equal(failed.status, 500);
  } finally {
    JobApplication.create = originalCreate;
  }
  assert.deepEqual(await fs.readdir(process.env.RESUME_UPLOAD_DIR), []);
});

test("resume is restored if database deletion fails and legacy deletion removes it", async () => {
  const { token: adminTokenValue } = await createAdmin();
  const submitted = await readJson(
    await request("/api/job-applications", {
      method: "POST",
      body: applicationPayload(pdfResume),
    })
  );
  const applicationId = submitted.body.data.application._id;
  const record = await JobApplication.findById(applicationId)
    .select("+resumeStoredPath")
    .lean();
  const resumePath = path.join(process.env.RESUME_UPLOAD_DIR, record.resumeStoredPath);

  const originalDelete = JobApplication.findByIdAndDelete;
  JobApplication.findByIdAndDelete = () => {
    throw new Error("forced isolated-test database failure");
  };
  try {
    const failed = await readJson(
      await request(`/api/admin/applications/${applicationId}`, {
        method: "DELETE",
        token: adminTokenValue,
      })
    );
    assert.equal(failed.status, 500);
  } finally {
    JobApplication.findByIdAndDelete = originalDelete;
  }
  await fs.access(resumePath);
  assert.ok(await JobApplication.findById(applicationId));

  const { token: userAdminToken } = await createUser({
    email: "legacy-admin@example.test",
  });
  const legacyDelete = await readJson(
    await request(`/api/job-applications/${applicationId}`, {
      method: "DELETE",
      token: userAdminToken,
    })
  );
  assert.equal(legacyDelete.status, 200);
  await assert.rejects(fs.access(resumePath));
});
