const authPanel = document.getElementById("authPanel");
const appPanel = document.getElementById("appPanel");
const activityPanel = document.getElementById("activityPanel");
const clearActivityBtn = document.getElementById("clearActivityBtn");

const loginForm = document.getElementById("loginForm");
const changePasswordForm = document.getElementById("changePasswordForm");
const logoutBtn = document.getElementById("logoutBtn");
const passwordChangePanel = document.getElementById("passwordChangePanel");

const runsPanel = document.getElementById("runsPanel");
const inventoryPanel = document.getElementById("inventoryPanel");
const modelsPanel = document.getElementById("modelsPanel");
const usersPanel = document.getElementById("usersPanel");
const profilesPanel = document.getElementById("profilesPanel");

const refreshRunsBtn = document.getElementById("refreshRunsBtn");
const refreshModelsBtn = document.getElementById("refreshModelsBtn");
const refreshUsersBtn = document.getElementById("refreshUsersBtn");
const refreshProfilesBtn = document.getElementById("refreshProfilesBtn");

const inventoryFilterForm = document.getElementById("inventoryFilterForm");
const profileForm = document.getElementById("profileForm");
const userForm = document.getElementById("userForm");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const cancelEditProfileBtn = document.getElementById("cancelEditProfileBtn");
const profileEditBanner = document.getElementById("profileEditBanner");

const profileScanType = document.getElementById("profileScanType");
const profileConfigInput = document.getElementById("profileConfigInput");

const secretBuilderForm = document.getElementById("secretBuilderForm");
const secretProviderSelect = document.getElementById("secretProvider");
const secretTargetFieldSelect = document.getElementById("secretTargetField");
const secretTargetPathInput = document.getElementById("secretTargetPath");
const previewSecretBtn = document.getElementById("previewSecretBtn");
const insertSecretBtn = document.getElementById("insertSecretBtn");
const copySecretBtn = document.getElementById("copySecretBtn");
const secretRefPreview = document.getElementById("secretRefPreview");
const providerEnvPanel = document.getElementById("providerEnv");
const providerAzurePanel = document.getElementById("providerAzure");
const providerAwsPanel = document.getElementById("providerAws");

const sensitiveFieldMap = {
  icmp: ["target"],
  snmp: ["community", "target"],
  azure: ["client_secret", "tenant_id", "client_id"],
  aws: ["secret_access_key", "session_token", "access_key_id"],
};

let accessToken = null;
let currentUser = null;
let profileEditId = null;

function logActivity(value) {
  const line = `[${new Date().toISOString()}] ${value}`;
  if (activityPanel.textContent === "Ready.") {
    activityPanel.textContent = line;
    return;
  }
  activityPanel.textContent = `${line}\n${activityPanel.textContent}`;
}

clearActivityBtn.addEventListener("click", () => {
  activityPanel.textContent = "Ready.";
});

function consumeTokenFromQuery() {
  const url = new URL(window.location.href);
  const token = url.searchParams.get("token");
  if (!token) {
    return;
  }

  localStorage.setItem("uda_token", token);
  url.searchParams.delete("token");
  window.history.replaceState({}, "", url.toString());
}

async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.detail || `${path} failed with status ${response.status}`);
  }

  return data;
}

function setAuthenticated(isAuthenticated) {
  authPanel.classList.toggle("hidden", isAuthenticated);
  appPanel.classList.toggle("hidden", !isAuthenticated);
}

function setPasswordChangeRequired(required) {
  if (!passwordChangePanel) {
    return;
  }
  passwordChangePanel.classList.toggle("hidden", !required);
  if (required) {
    authPanel.classList.remove("hidden");
    appPanel.classList.add("hidden");
  }
}

function setAdminVisibility(isAdmin) {
  document.querySelectorAll(".admin-only").forEach((element) => {
    element.classList.toggle("hidden", !isAdmin);
  });
}

function activateTab(tabName) {
  document.querySelectorAll(".tab[data-tab]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabName);
  });

  document.querySelectorAll(".tab-view").forEach((view) => {
    view.classList.toggle("hidden", view.id !== `view-${tabName}`);
  });
}

function setProfileEditState(editing, profile = null) {
  profileEditId = editing && profile ? profile.id : null;

  if (profileEditBanner) {
    profileEditBanner.classList.toggle("hidden", !editing);
    profileEditBanner.textContent = editing && profile ? `Editing profile: ${profile.name}` : "Editing profile";
  }

  if (cancelEditProfileBtn) {
    cancelEditProfileBtn.classList.toggle("hidden", !editing);
  }

  if (saveProfileBtn) {
    saveProfileBtn.textContent = editing ? "Update Profile" : "Save Profile";
  }

  if (profileScanType) {
    profileScanType.disabled = editing;
  }
}

function resetProfileForm() {
  profileForm.reset();
  if (profileScanType) {
    profileScanType.value = "icmp";
  }
  if (profileConfigInput) {
    profileConfigInput.value = JSON.stringify(
      {
        target: "10.0.0.0/24",
        timeout_seconds: 1,
        concurrency: 100,
        max_hosts: 1024,
      },
      null,
      2,
    );
  }
  setProfileEditState(false);
  refreshTargetFieldOptions();
}

async function loadAppData() {
  activateTab("inventory");
  await refreshRuns();
  await refreshInventory();
  await refreshModels();
  await refreshUsers();
  await refreshProfiles();
}

function refreshTargetFieldOptions() {
  if (!profileScanType || !secretTargetFieldSelect) {
    return;
  }

  const scanType = profileScanType.value || "icmp";
  const fields = sensitiveFieldMap[scanType] || [];
  const previous = secretTargetFieldSelect.value;
  secretTargetFieldSelect.innerHTML = "";

  fields.forEach((field) => {
    const option = document.createElement("option");
    option.value = field;
    option.textContent = field;
    secretTargetFieldSelect.appendChild(option);
  });

  const extraOption = document.createElement("option");
  extraOption.value = "custom";
  extraOption.textContent = "custom";
  secretTargetFieldSelect.appendChild(extraOption);

  const validPrevious = [...secretTargetFieldSelect.options].some((item) => item.value === previous);
  secretTargetFieldSelect.value = validPrevious ? previous : (fields[0] || "custom");
}

function toggleProviderPanels() {
  const provider = secretProviderSelect.value;
  providerEnvPanel.classList.toggle("hidden", provider !== "env");
  providerAzurePanel.classList.toggle("hidden", provider !== "azure_key_vault");
  providerAwsPanel.classList.toggle("hidden", provider !== "aws_secrets_manager");
}

function targetPathFromBuilder() {
  const customPath = String(secretTargetPathInput.value || "").trim();
  if (customPath) {
    return customPath;
  }

  const selected = String(secretTargetFieldSelect.value || "").trim();
  if (!selected || selected === "custom") {
    throw new Error("Choose a target field or provide a custom path");
  }
  return selected;
}

function buildSecretReference() {
  const fd = new FormData(secretBuilderForm);
  const provider = String(fd.get("provider") || "").trim();

  if (provider === "env") {
    const key = String(fd.get("env_key") || "").trim();
    if (!key) {
      throw new Error("env provider requires Environment Variable Key");
    }
    return { $secret: { provider: "env", key } };
  }

  if (provider === "azure_key_vault") {
    const vault_url = String(fd.get("azure_vault_url") || "").trim();
    const name = String(fd.get("azure_name") || "").trim();
    const version = String(fd.get("azure_version") || "").trim();
    if (!vault_url || !name) {
      throw new Error("azure_key_vault requires Vault URL and Secret Name");
    }
    return {
      $secret: {
        provider: "azure_key_vault",
        vault_url,
        name,
        ...(version ? { version } : {}),
      },
    };
  }

  if (provider === "aws_secrets_manager") {
    const secret_id = String(fd.get("aws_secret_id") || "").trim();
    const region = String(fd.get("aws_region") || "").trim();
    const json_key = String(fd.get("aws_json_key") || "").trim();
    if (!secret_id) {
      throw new Error("aws_secrets_manager requires Secret ID");
    }
    return {
      $secret: {
        provider: "aws_secrets_manager",
        secret_id,
        ...(region ? { region } : {}),
        ...(json_key ? { json_key } : {}),
      },
    };
  }

  throw new Error("Unsupported secret provider");
}

function setValueAtPath(obj, path, value) {
  const parts = path
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) {
    throw new Error("Target path is empty");
  }

  let cursor = obj;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index];
    if (typeof cursor[key] !== "object" || cursor[key] === null || Array.isArray(cursor[key])) {
      cursor[key] = {};
    }
    cursor = cursor[key];
  }

  cursor[parts[parts.length - 1]] = value;
}

function renderSecretPreview(targetPath, reference) {
  secretRefPreview.textContent = JSON.stringify(
    {
      target_path: targetPath,
      reference,
    },
    null,
    2,
  );
}

async function refreshRuns() {
  const runs = await apiFetch("/api/inventory/runs?limit=80");
  runsPanel.textContent = JSON.stringify(runs, null, 2);
}

async function refreshInventory(provider = "", itemType = "", search = "") {
  const params = new URLSearchParams();
  params.set("limit", "300");
  if (provider) {
    params.set("provider", provider);
  }
  if (itemType) {
    params.set("item_type", itemType);
  }
  if (search) {
    params.set("search", search);
  }

  const items = await apiFetch(`/api/inventory/items?${params.toString()}`);
  inventoryPanel.textContent = JSON.stringify(items, null, 2);
}

async function refreshModels() {
  const model = await apiFetch("/api/service-models/overview");
  modelsPanel.textContent = JSON.stringify(model, null, 2);
}

async function refreshUsers() {
  if (currentUser?.role !== "admin") {
    return;
  }
  const users = await apiFetch("/api/admin/users");
  usersPanel.textContent = JSON.stringify(users, null, 2);
}

function profileCardHtml(profile) {
  return `
    <div class="list-item">
      <h4>${profile.name}</h4>
      <div>Type: ${profile.scan_type}</div>
      <div>Schedule: every ${profile.schedule_minutes} min</div>
      <div>Enabled: ${profile.is_enabled}</div>
      <div class="mini-actions">
        <button data-edit-id="${profile.id}">Edit</button>
        <button data-run-id="${profile.id}">Run Now</button>
      </div>
    </div>
  `;
}

async function refreshProfiles() {
  if (currentUser?.role !== "admin") {
    return;
  }
  const profiles = await apiFetch("/api/admin/scan-profiles");
  profilesPanel.innerHTML = profiles.map(profileCardHtml).join("");

  profilesPanel.querySelectorAll("button[data-edit-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.editId);
      const profile = profiles.find((candidate) => candidate.id === id);
      if (!profile) {
        return;
      }

      profileForm.elements.name.value = profile.name;
      profileForm.elements.schedule_minutes.value = String(profile.schedule_minutes);
      profileForm.elements.is_enabled.value = profile.is_enabled ? "true" : "false";
      if (profileScanType) {
        profileScanType.value = profile.scan_type;
      }
      profileConfigInput.value = JSON.stringify(profile.config || {}, null, 2);
      setProfileEditState(true, profile);
      refreshTargetFieldOptions();
      logActivity(`Editing profile ${profile.name}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  profilesPanel.querySelectorAll("button[data-run-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.runId;
      try {
        const run = await apiFetch(`/api/admin/scan-profiles/${id}/run`, {
          method: "POST",
        });
        logActivity(`Manual run started for profile ${id}. Result status: ${run.status}`);
        await refreshRuns();
        await refreshInventory();
      } catch (error) {
        logActivity(String(error));
      }
    });
  });
}

async function initializeSession() {
  consumeTokenFromQuery();
  accessToken = localStorage.getItem("uda_token");

  if (!accessToken) {
    setAuthenticated(false);
    return;
  }

  try {
    currentUser = await apiFetch("/api/auth/me");
    setAdminVisibility(currentUser.role === "admin");
    if (currentUser.must_change_password) {
      setPasswordChangeRequired(true);
      logActivity(`Signed in as ${currentUser.username}. Password change is required.`);
      return;
    }

    setPasswordChangeRequired(false);
    setAuthenticated(true);
    await loadAppData();
    logActivity(`Signed in as ${currentUser.username} (${currentUser.role})`);
  } catch {
    localStorage.removeItem("uda_token");
    accessToken = null;
    currentUser = null;
    setAuthenticated(false);
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const fd = new FormData(loginForm);
  const payload = {
    username: fd.get("username"),
    password: fd.get("password"),
  };

  try {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    localStorage.setItem("uda_token", data.access_token);
    accessToken = data.access_token;
    currentUser = data.user;
    setAdminVisibility(currentUser.role === "admin");

    if (data.must_change_password || currentUser.must_change_password) {
      setPasswordChangeRequired(true);
      logActivity(`Local login successful: ${currentUser.username}. Password change required.`);
      return;
    }

    setPasswordChangeRequired(false);
    setAuthenticated(true);
    await loadAppData();
    logActivity(`Local login successful: ${currentUser.username}`);
  } catch (error) {
    logActivity(`Login failed: ${String(error)}`);
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("uda_token");
  accessToken = null;
  currentUser = null;
  setPasswordChangeRequired(false);
  setAuthenticated(false);
  setAdminVisibility(false);
  logActivity("Logged out");
});

document.querySelectorAll(".tab[data-tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    const tabName = tab.dataset.tab;
    if (tab.classList.contains("admin-only") && currentUser?.role !== "admin") {
      return;
    }
    activateTab(tabName);
  });
});

refreshRunsBtn.addEventListener("click", async () => {
  try {
    await refreshRuns();
    logActivity("Scan runs refreshed");
  } catch (error) {
    logActivity(String(error));
  }
});

inventoryFilterForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const fd = new FormData(inventoryFilterForm);
  const provider = String(fd.get("provider") || "").trim();
  const itemType = String(fd.get("item_type") || "").trim();
  const search = String(fd.get("search") || "").trim();

  try {
    await refreshInventory(provider, itemType, search);
    logActivity("Inventory refreshed with filters");
  } catch (error) {
    logActivity(String(error));
  }
});

refreshModelsBtn.addEventListener("click", async () => {
  try {
    await refreshModels();
    logActivity("Service model refreshed");
  } catch (error) {
    logActivity(String(error));
  }
});

if (changePasswordForm) {
  changePasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const fd = new FormData(changePasswordForm);
    const currentPassword = String(fd.get("current_password") || "");
    const newPassword = String(fd.get("new_password") || "");
    const confirm = String(fd.get("confirm_new_password") || "");

    if (newPassword !== confirm) {
      logActivity("New password and confirmation do not match");
      return;
    }

    try {
      const data = await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      currentUser = data.user;
      setPasswordChangeRequired(false);
      setAuthenticated(true);
      setAdminVisibility(currentUser.role === "admin");
      changePasswordForm.reset();
      await loadAppData();
      logActivity("Password changed successfully. Full access restored.");
    } catch (error) {
      logActivity(`Password change failed: ${String(error)}`);
    }
  });
}

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const fd = new FormData(profileForm);

  let parsedConfig = {};
  try {
    parsedConfig = JSON.parse(String(fd.get("config") || "{}"));
  } catch {
    logActivity("Config JSON is invalid");
    return;
  }

  const payload = {
    name: fd.get("name"),
    scan_type: fd.get("scan_type"),
    schedule_minutes: Number(fd.get("schedule_minutes")),
    is_enabled: fd.get("is_enabled") === "true",
    config: parsedConfig,
  };

  try {
    if (profileEditId) {
      await apiFetch(`/api/admin/scan-profiles/${profileEditId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: payload.name,
          schedule_minutes: payload.schedule_minutes,
          is_enabled: payload.is_enabled,
          config: payload.config,
        }),
      });
      logActivity(`Profile updated: ${payload.name}`);
    } else {
      await apiFetch("/api/admin/scan-profiles", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      logActivity(`Profile created: ${payload.name}`);
    }

    resetProfileForm();
    await refreshProfiles();
  } catch (error) {
    logActivity(String(error));
  }
});

if (cancelEditProfileBtn) {
  cancelEditProfileBtn.addEventListener("click", () => {
    resetProfileForm();
    logActivity("Profile edit canceled");
  });
}

if (profileScanType) {
  profileScanType.addEventListener("change", () => {
    refreshTargetFieldOptions();
  });
}

if (secretProviderSelect) {
  secretProviderSelect.addEventListener("change", () => {
    toggleProviderPanels();
  });
}

if (previewSecretBtn) {
  previewSecretBtn.addEventListener("click", () => {
    try {
      const targetPath = targetPathFromBuilder();
      const reference = buildSecretReference();
      renderSecretPreview(targetPath, reference);
      logActivity(`Secret reference preview generated for ${targetPath}`);
    } catch (error) {
      logActivity(String(error));
    }
  });
}

if (insertSecretBtn) {
  insertSecretBtn.addEventListener("click", () => {
    try {
      const targetPath = targetPathFromBuilder();
      const reference = buildSecretReference();

      const raw = String(profileConfigInput.value || "{}");
      const parsed = JSON.parse(raw);
      setValueAtPath(parsed, targetPath, reference);

      profileConfigInput.value = JSON.stringify(parsed, null, 2);
      renderSecretPreview(targetPath, reference);
      logActivity(`Secret reference inserted into config at '${targetPath}'`);
    } catch (error) {
      logActivity(String(error));
    }
  });
}

if (copySecretBtn) {
  copySecretBtn.addEventListener("click", async () => {
    try {
      const reference = buildSecretReference();
      await navigator.clipboard.writeText(JSON.stringify(reference, null, 2));
      logActivity("Secret reference copied to clipboard");
    } catch (error) {
      logActivity(String(error));
    }
  });
}

userForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const fd = new FormData(userForm);

  const payload = {
    username: String(fd.get("username") || "").trim(),
    email: String(fd.get("email") || "").trim() || null,
    password: String(fd.get("password") || "").trim() || null,
    role: fd.get("role"),
    provider: fd.get("provider"),
    entra_oid: String(fd.get("entra_oid") || "").trim() || null,
  };

  try {
    await apiFetch("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    logActivity(`User created: ${payload.username}`);
    await refreshUsers();
  } catch (error) {
    logActivity(String(error));
  }
});

refreshUsersBtn.addEventListener("click", async () => {
  try {
    await refreshUsers();
    logActivity("User list refreshed");
  } catch (error) {
    logActivity(String(error));
  }
});

refreshProfilesBtn.addEventListener("click", async () => {
  try {
    await refreshProfiles();
    logActivity("Profiles refreshed");
  } catch (error) {
    logActivity(String(error));
  }
});

refreshTargetFieldOptions();
toggleProviderPanels();
setProfileEditState(false);

initializeSession();
