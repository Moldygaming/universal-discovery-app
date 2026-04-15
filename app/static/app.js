const authPanel = document.getElementById("authPanel");
const appPanel = document.getElementById("appPanel");
const activityPanel = document.getElementById("activityPanel");
const clearActivityBtn = document.getElementById("clearActivityBtn");

const loginForm = document.getElementById("loginForm");
const changePasswordForm = document.getElementById("changePasswordForm");
const logoutBtn = document.getElementById("logoutBtn");
const passwordChangePanel = document.getElementById("passwordChangePanel");
const menuToggleBtn = document.getElementById("menuToggleBtn");
const menuDropdown = document.getElementById("menuDropdown");

const runsPanel = document.getElementById("runsPanel");
const inventoryPanel = document.getElementById("inventoryPanel");
const inventoryTableHead = document.getElementById("inventoryTableHead");
const inventoryTableBody = document.getElementById("inventoryTableBody");
const inventoryProviderFilter = document.getElementById("inventoryProviderFilter");
const inventoryItemTypeMenuBtn = document.getElementById("inventoryItemTypeMenuBtn");
const inventoryItemTypeMenu = document.getElementById("inventoryItemTypeMenu");
const inventoryItemTypeOptions = document.getElementById("inventoryItemTypeOptions");
const selectAllInventoryItemTypesBtn = document.getElementById("selectAllInventoryItemTypesBtn");
const clearAllInventoryItemTypesBtn = document.getElementById("clearAllInventoryItemTypesBtn");
const inventoryAttributeFilterMenuBtn = document.getElementById("inventoryAttributeFilterMenuBtn");
const inventoryAttributeFilterMenu = document.getElementById("inventoryAttributeFilterMenu");
const inventoryAttributeFilterOptions = document.getElementById("inventoryAttributeFilterOptions");
const selectAllInventoryAttributesBtn = document.getElementById("selectAllInventoryAttributesBtn");
const clearAllInventoryAttributesBtn = document.getElementById("clearAllInventoryAttributesBtn");
const inventoryViewMode = document.getElementById("inventoryViewMode");
const adminBladeItems = Array.from(document.querySelectorAll(".admin-blade-item"));
const adminPanes = Array.from(document.querySelectorAll(".admin-pane"));
const modelsPanel = document.getElementById("modelsPanel");
const usersListPanel = document.getElementById("usersListPanel");
const profilesPanel = document.getElementById("profilesPanel");

const refreshRunsBtn = document.getElementById("refreshRunsBtn");
const refreshModelsBtn = document.getElementById("refreshModelsBtn");
const newServiceModelBtn = document.getElementById("newServiceModelBtn");
const refreshUsersBtn = document.getElementById("refreshUsersBtn");
const refreshProfilesBtn = document.getElementById("refreshProfilesBtn");

const inventoryFilterForm = document.getElementById("inventoryFilterForm");
const profileForm = document.getElementById("profileForm");
const userForm = document.getElementById("userForm");
const serviceModelForm = document.getElementById("serviceModelForm");
const serviceModelNameInput = document.getElementById("serviceModelName");
const serviceModelDescriptionInput = document.getElementById("serviceModelDescription");
const serviceModelIsActiveSelect = document.getElementById("serviceModelIsActive");
const saveServiceModelBtn = document.getElementById("saveServiceModelBtn");
const deleteServiceModelBtn = document.getElementById("deleteServiceModelBtn");
const serviceModelListPanel = document.getElementById("serviceModelListPanel");
const serviceResourceSearchForm = document.getElementById("serviceResourceSearchForm");
const serviceResourceSearchInput = document.getElementById("serviceResourceSearch");
const serviceResourceProviderSelect = document.getElementById("serviceResourceProvider");
const serviceInventoryCandidatesPanel = document.getElementById("serviceInventoryCandidatesPanel");
const attachSelectedResourcesBtn = document.getElementById("attachSelectedResourcesBtn");
const serviceResourcesPanel = document.getElementById("serviceResourcesPanel");
const serviceDependenciesPanel = document.getElementById("serviceDependenciesPanel");
const dependencyTargetServiceSelect = document.getElementById("dependencyTargetServiceSelect");
const dependencyRelationInput = document.getElementById("dependencyRelationInput");
const addDependencyBtn = document.getElementById("addDependencyBtn");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const cancelEditProfileBtn = document.getElementById("cancelEditProfileBtn");
const profileEditBanner = document.getElementById("profileEditBanner");

const profileScanType = document.getElementById("profileScanType");
const profileQuickSettings = document.getElementById("profileQuickSettings");
const profileConfigInput = document.getElementById("profileConfigInput");
const azureTenantsPanel = document.getElementById("azureTenantsPanel");
const awsAccountsPanel = document.getElementById("awsAccountsPanel");
const gcpAccountsPanel = document.getElementById("gcpAccountsPanel");
const secretRefsPanel = document.getElementById("secretRefsPanel");
const refreshCloudConfigBtn = document.getElementById("refreshCloudConfigBtn");
const openAzureTenantModalBtn = document.getElementById("openAzureTenantModalBtn");
const openAwsAccountModalBtn = document.getElementById("openAwsAccountModalBtn");
const openGcpAccountModalBtn = document.getElementById("openGcpAccountModalBtn");
const openSecretRefModalBtn = document.getElementById("openSecretRefModalBtn");
const azureTenantModal = document.getElementById("azureTenantModal");
const azureTenantModalTitle = document.getElementById("azureTenantModalTitle");
const saveAzureTenantBtn = document.getElementById("saveAzureTenantBtn");
const closeAzureTenantModalBtn = document.getElementById("closeAzureTenantModalBtn");
const azureTenantForm = document.getElementById("azureTenantForm");
const azureClientSecretMode = document.getElementById("azureClientSecretMode");
const azureClientSecretRefSelect = document.getElementById("azureClientSecretRefSelect");
const azureSecretRefPanel = document.getElementById("azureSecretRefPanel");
const azureInlineSecretPanel = document.getElementById("azureInlineSecretPanel");
const azureInlineClientSecretInput = document.getElementById("azureInlineClientSecretInput");
const azureTenantProfileMode = document.getElementById("azureTenantProfileMode");
const azureTenantProfileCreatePanel = document.getElementById("azureTenantProfileCreatePanel");
const azureTenantProfileExistingPanel = document.getElementById("azureTenantProfileExistingPanel");
const azureTenantExistingProfileSelect = document.getElementById("azureTenantExistingProfileSelect");
const awsAccountModal = document.getElementById("awsAccountModal");
const awsAccountModalTitle = document.getElementById("awsAccountModalTitle");
const saveAwsAccountBtn = document.getElementById("saveAwsAccountBtn");
const closeAwsAccountModalBtn = document.getElementById("closeAwsAccountModalBtn");
const awsAccountForm = document.getElementById("awsAccountForm");
const awsAuthMode = document.getElementById("awsAuthMode");
const awsAccessKeyPanel = document.getElementById("awsAccessKeyPanel");
const awsAssumeRolePanel = document.getElementById("awsAssumeRolePanel");
const awsCredentialSource = document.getElementById("awsCredentialSource");
const awsAccessKeyRefPanel = document.getElementById("awsAccessKeyRefPanel");
const awsAccessKeyInlinePanel = document.getElementById("awsAccessKeyInlinePanel");
const awsAccessKeyRefSelect = document.getElementById("awsAccessKeyRefSelect");
const awsSecretAccessKeyRefSelect = document.getElementById("awsSecretAccessKeyRefSelect");
const awsSessionTokenRefSelect = document.getElementById("awsSessionTokenRefSelect");
const awsAccessKeyIdInput = document.getElementById("awsAccessKeyIdInput");
const awsSecretAccessKeyInput = document.getElementById("awsSecretAccessKeyInput");
const awsRoleArnInput = document.getElementById("awsRoleArnInput");
const awsExternalIdInput = document.getElementById("awsExternalIdInput");
const gcpAccountModal = document.getElementById("gcpAccountModal");
const gcpAccountModalTitle = document.getElementById("gcpAccountModalTitle");
const saveGcpAccountBtn = document.getElementById("saveGcpAccountBtn");
const closeGcpAccountModalBtn = document.getElementById("closeGcpAccountModalBtn");
const gcpAccountForm = document.getElementById("gcpAccountForm");
const gcpServiceAccountMode = document.getElementById("gcpServiceAccountMode");
const gcpServiceAccountRefPanel = document.getElementById("gcpServiceAccountRefPanel");
const gcpServiceAccountInlinePanel = document.getElementById("gcpServiceAccountInlinePanel");
const gcpServiceAccountRefSelect = document.getElementById("gcpServiceAccountRefSelect");
const gcpInlineServiceAccountJsonInput = document.getElementById("gcpInlineServiceAccountJsonInput");
const ssoConfigForm = document.getElementById("ssoConfigForm");
const ssoClientSecretMode = document.getElementById("ssoClientSecretMode");
const ssoClientSecretRefSelect = document.getElementById("ssoClientSecretRefSelect");
const ssoSecretRefPanel = document.getElementById("ssoSecretRefPanel");
const ssoInlineSecretPanel = document.getElementById("ssoInlineSecretPanel");
const ssoInlineClientSecretInput = document.getElementById("ssoInlineClientSecretInput");
const saveSsoConfigBtn = document.getElementById("saveSsoConfigBtn");
const refreshSsoConfigBtn = document.getElementById("refreshSsoConfigBtn");
const ssoConfigSummary = document.getElementById("ssoConfigSummary");
const secretRefModal = document.getElementById("secretRefModal");
const secretRefModalTitle = document.getElementById("secretRefModalTitle");
const saveSecretRefBtn = document.getElementById("saveSecretRefBtn");
const closeSecretRefModalBtn = document.getElementById("closeSecretRefModalBtn");
const secretRefForm = document.getElementById("secretRefForm");
const secretRefProvider = document.getElementById("secretRefProvider");
const secretRefProviderEnv = document.getElementById("secretRefProviderEnv");
const secretRefProviderAzure = document.getElementById("secretRefProviderAzure");
const secretRefProviderAws = document.getElementById("secretRefProviderAws");

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
  gcp: ["service_account_json"],
};

const profileConfigKnownKeysByType = {
  icmp: ["target", "timeout_seconds", "concurrency", "max_hosts"],
  snmp: ["target", "community", "version", "oid", "port", "timeout_seconds", "concurrency", "max_hosts"],
  azure: ["tenant_config_id", "max_resources_per_subscription"],
  aws: ["aws_account_id", "max_resources_per_region"],
  gcp: ["gcp_account_id", "max_resources_per_project"],
};

let accessToken = null;
let currentUser = null;
let profileEditId = null;
let secretReferences = [];
let azureTenants = [];
let awsAccounts = [];
let gcpAccounts = [];
let secretRefEditId = null;
let azureTenantEditId = null;
let awsAccountEditId = null;
let gcpAccountEditId = null;
let azureTenantCurrentSecretSource = null;
let gcpAccountCurrentSecretSource = null;
let ssoConfig = null;
let ssoCurrentSecretSource = "none";
let inventoryProviderTypeMap = {};
let inventoryAllItemTypes = [];
let inventoryLatestItems = [];
let inventoryVisibleItemTypes = {};
let inventoryVisibleAttributes = {};
let activeAdminPane = "cloud-accounts";
let scanProfiles = [];
let serviceModels = [];
let selectedServiceModelId = null;
let serviceInventoryCandidates = [];
let serviceSearchDebounceHandle = null;

function defaultProfileConfig(scanType) {
  if (scanType === "snmp") {
    return {
      target: "10.0.0.0/24",
      community: "public",
      version: "2c",
      oid: "1.3.6.1.2.1.1.1.0",
      port: 161,
      timeout_seconds: 1,
      concurrency: 100,
      max_hosts: 1024,
    };
  }

  if (scanType === "azure") {
    return {
      tenant_config_id: null,
      max_resources_per_subscription: 2000,
    };
  }

  if (scanType === "aws") {
    return {
      aws_account_id: null,
      max_resources_per_region: 2000,
    };
  }

  if (scanType === "gcp") {
    return {
      gcp_account_id: null,
      max_resources_per_project: 2000,
    };
  }

  return {
    target: "10.0.0.0/24",
    timeout_seconds: 1,
    concurrency: 100,
    max_hosts: 1024,
  };
}

function parseProfileConfigInput() {
  if (!profileConfigInput) {
    return null;
  }

  try {
    const parsed = JSON.parse(String(profileConfigInput.value || "{}"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeProfileConfigInput(config) {
  if (!profileConfigInput) {
    return;
  }
  profileConfigInput.value = JSON.stringify(config || {}, null, 2);
}

function mergeGeneratedProfileConfig(scanType, generatedConfig) {
  const existing = parseProfileConfigInput();
  if (!existing) {
    return generatedConfig;
  }

  const knownKeys = new Set(profileConfigKnownKeysByType[scanType] || []);
  const preserved = {};

  Object.entries(existing).forEach(([key, value]) => {
    if (!knownKeys.has(key)) {
      preserved[key] = value;
    }
  });

  return {
    ...preserved,
    ...generatedConfig,
  };
}

function numberOrDefault(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildProfileConfigFromQuickSettings(scanType) {
  if (!profileQuickSettings) {
    return defaultProfileConfig(scanType);
  }

  const getValue = (name) => String(profileQuickSettings.querySelector(`[name="${name}"]`)?.value || "").trim();

  if (scanType === "snmp") {
    return {
      target: getValue("snmp_target") || "10.0.0.0/24",
      community: getValue("snmp_community") || "public",
      version: getValue("snmp_version") || "2c",
      oid: getValue("snmp_oid") || "1.3.6.1.2.1.1.1.0",
      port: numberOrDefault(getValue("snmp_port"), 161),
      timeout_seconds: numberOrDefault(getValue("snmp_timeout_seconds"), 1),
      concurrency: numberOrDefault(getValue("snmp_concurrency"), 100),
      max_hosts: numberOrDefault(getValue("snmp_max_hosts"), 1024),
    };
  }

  if (scanType === "azure") {
    const tenantConfigId = Number(getValue("azure_tenant_config_id"));
    const config = {
      max_resources_per_subscription: numberOrDefault(getValue("azure_max_resources_per_subscription"), 2000),
    };
    if (Number.isInteger(tenantConfigId) && tenantConfigId > 0) {
      config.tenant_config_id = tenantConfigId;
    }
    return config;
  }

  if (scanType === "aws") {
    const awsAccountId = Number(getValue("aws_account_id"));
    const config = {
      max_resources_per_region: numberOrDefault(getValue("aws_max_resources_per_region"), 2000),
    };
    if (Number.isInteger(awsAccountId) && awsAccountId > 0) {
      config.aws_account_id = awsAccountId;
    }
    return config;
  }

  if (scanType === "gcp") {
    const gcpAccountId = Number(getValue("gcp_account_id"));
    const config = {
      max_resources_per_project: numberOrDefault(getValue("gcp_max_resources_per_project"), 2000),
    };
    if (Number.isInteger(gcpAccountId) && gcpAccountId > 0) {
      config.gcp_account_id = gcpAccountId;
    }
    return config;
  }

  return {
    target: getValue("icmp_target") || "10.0.0.0/24",
    timeout_seconds: numberOrDefault(getValue("icmp_timeout_seconds"), 1),
    concurrency: numberOrDefault(getValue("icmp_concurrency"), 100),
    max_hosts: numberOrDefault(getValue("icmp_max_hosts"), 1024),
  };
}

function applyQuickSettingsToProfileConfig() {
  const scanType = String(profileScanType?.value || "icmp");
  const generated = buildProfileConfigFromQuickSettings(scanType);
  const merged = mergeGeneratedProfileConfig(scanType, generated);
  writeProfileConfigInput(merged);
  refreshTargetFieldOptions();
}

function renderProfileQuickSettings() {
  if (!profileQuickSettings || !profileScanType) {
    return;
  }

  const scanType = String(profileScanType.value || "icmp");
  const parsed = parseProfileConfigInput();
  const defaults = defaultProfileConfig(scanType);
  const config = parsed ? { ...defaults, ...parsed } : defaults;

  if (scanType === "azure") {
    const tenantOptions = [
      '<option value="">-- select Azure tenant config --</option>',
      ...azureTenants.map((tenant) => {
        const selected = Number(config.tenant_config_id) === Number(tenant.id) ? "selected" : "";
        return `<option value="${tenant.id}" ${selected}>${escapeHtml(tenant.name)} (${escapeHtml(tenant.tenant_id)})</option>`;
      }),
    ].join("");

    profileQuickSettings.innerHTML = `
      <p class="profile-quick-title">Cloud Settings (Azure)</p>
      <div class="inline two">
        <label>Tenant Config
          <select name="azure_tenant_config_id" data-profile-setting>${tenantOptions}</select>
        </label>
        <label>Max Resources / Subscription
          <input name="azure_max_resources_per_subscription" type="number" min="1" max="50000" value="${escapeHtml(config.max_resources_per_subscription ?? 2000)}" data-profile-setting />
        </label>
      </div>
    `;
  } else if (scanType === "aws") {
    const accountOptions = [
      '<option value="">-- select AWS account config --</option>',
      ...awsAccounts.map((account) => {
        const selected = Number(config.aws_account_id) === Number(account.id) ? "selected" : "";
        return `<option value="${account.id}" ${selected}>${escapeHtml(account.name)}</option>`;
      }),
    ].join("");

    profileQuickSettings.innerHTML = `
      <p class="profile-quick-title">Cloud Settings (AWS)</p>
      <div class="inline two">
        <label>AWS Account Config
          <select name="aws_account_id" data-profile-setting>${accountOptions}</select>
        </label>
        <label>Max Resources / Region
          <input name="aws_max_resources_per_region" type="number" min="1" max="50000" value="${escapeHtml(config.max_resources_per_region ?? 2000)}" data-profile-setting />
        </label>
      </div>
    `;
  } else if (scanType === "gcp") {
    const accountOptions = [
      '<option value="">-- select GCP account config --</option>',
      ...gcpAccounts.map((account) => {
        const selected = Number(config.gcp_account_id) === Number(account.id) ? "selected" : "";
        return `<option value="${account.id}" ${selected}>${escapeHtml(account.name)}</option>`;
      }),
    ].join("");

    profileQuickSettings.innerHTML = `
      <p class="profile-quick-title">Cloud Settings (GCP)</p>
      <div class="inline two">
        <label>GCP Account Config
          <select name="gcp_account_id" data-profile-setting>${accountOptions}</select>
        </label>
        <label>Max Resources / Project
          <input name="gcp_max_resources_per_project" type="number" min="1" max="50000" value="${escapeHtml(config.max_resources_per_project ?? 2000)}" data-profile-setting />
        </label>
      </div>
    `;
  } else if (scanType === "snmp") {
    profileQuickSettings.innerHTML = `
      <p class="profile-quick-title">Network Settings (SNMP)</p>
      <div class="inline two">
        <label>Target Range / CIDR
          <input name="snmp_target" value="${escapeHtml(config.target ?? "10.0.0.0/24")}" data-profile-setting />
        </label>
        <label>Protocol
          <input value="snmp" disabled />
        </label>
      </div>
      <div class="inline four">
        <label>Community
          <input name="snmp_community" value="${escapeHtml(config.community ?? "public")}" data-profile-setting />
        </label>
        <label>Version
          <input name="snmp_version" value="${escapeHtml(config.version ?? "2c")}" data-profile-setting />
        </label>
        <label>OID
          <input name="snmp_oid" value="${escapeHtml(config.oid ?? "1.3.6.1.2.1.1.1.0")}" data-profile-setting />
        </label>
        <label>Port
          <input name="snmp_port" type="number" min="1" max="65535" value="${escapeHtml(config.port ?? 161)}" data-profile-setting />
        </label>
      </div>
      <div class="inline three">
        <label>Timeout Seconds
          <input name="snmp_timeout_seconds" type="number" step="0.1" min="0.1" value="${escapeHtml(config.timeout_seconds ?? 1)}" data-profile-setting />
        </label>
        <label>Concurrency
          <input name="snmp_concurrency" type="number" min="1" value="${escapeHtml(config.concurrency ?? 100)}" data-profile-setting />
        </label>
        <label>Max Hosts
          <input name="snmp_max_hosts" type="number" min="1" value="${escapeHtml(config.max_hosts ?? 1024)}" data-profile-setting />
        </label>
      </div>
    `;
  } else {
    profileQuickSettings.innerHTML = `
      <p class="profile-quick-title">Network Settings (ICMP)</p>
      <div class="inline two">
        <label>Target Range / CIDR
          <input name="icmp_target" value="${escapeHtml(config.target ?? "10.0.0.0/24")}" data-profile-setting />
        </label>
        <label>Protocol
          <input value="icmp" disabled />
        </label>
      </div>
      <div class="inline three">
        <label>Timeout Seconds
          <input name="icmp_timeout_seconds" type="number" step="0.1" min="0.1" value="${escapeHtml(config.timeout_seconds ?? 1)}" data-profile-setting />
        </label>
        <label>Concurrency
          <input name="icmp_concurrency" type="number" min="1" value="${escapeHtml(config.concurrency ?? 100)}" data-profile-setting />
        </label>
        <label>Max Hosts
          <input name="icmp_max_hosts" type="number" min="1" value="${escapeHtml(config.max_hosts ?? 1024)}" data-profile-setting />
        </label>
      </div>
    `;
  }

  profileQuickSettings.querySelectorAll("[data-profile-setting]").forEach((element) => {
    const handler = () => applyQuickSettingsToProfileConfig();
    element.addEventListener("change", handler);
    if (element.tagName === "INPUT") {
      element.addEventListener("input", handler);
    }
  });
}

function setProfileConfigForScanType(scanType, initialConfig = null) {
  const config = initialConfig && typeof initialConfig === "object" && !Array.isArray(initialConfig)
    ? { ...defaultProfileConfig(scanType), ...initialConfig }
    : defaultProfileConfig(scanType);
  writeProfileConfigInput(config);
  renderProfileQuickSettings();
  refreshTargetFieldOptions();
}

function logActivity(value) {
  if (!activityPanel) {
    return;
  }
  const line = `[${new Date().toISOString()}] ${value}`;
  if (activityPanel.textContent === "Ready.") {
    activityPanel.textContent = line;
    return;
  }
  activityPanel.textContent = `${line}\n${activityPanel.textContent}`;
}

if (clearActivityBtn && activityPanel) {
  clearActivityBtn.addEventListener("click", () => {
    activityPanel.textContent = "Ready.";
  });
}

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

function activateAdminPane(paneName) {
  if (!adminBladeItems.length || !adminPanes.length) {
    return;
  }

  const paneExists = adminPanes.some((pane) => pane.dataset.adminPane === paneName);
  const resolvedPane = paneExists ? paneName : "cloud-accounts";
  activeAdminPane = resolvedPane;

  adminBladeItems.forEach((button) => {
    button.classList.toggle("active", button.dataset.adminPane === resolvedPane);
  });

  adminPanes.forEach((pane) => {
    pane.classList.toggle("hidden", pane.dataset.adminPane !== resolvedPane);
  });

  if (resolvedPane === "user-management" && currentUser?.role === "admin") {
    refreshUsers().catch((error) => logActivity(String(error)));
  }
  if (resolvedPane === "sso-integration" && currentUser?.role === "admin") {
    refreshSsoConfig().catch((error) => logActivity(String(error)));
  }
}

function activateTab(tabName) {
  document.querySelectorAll(".menu-item[data-tab]").forEach((item) => {
    item.classList.toggle("active", item.dataset.tab === tabName);
  });

  document.querySelectorAll(".tab-view").forEach((view) => {
    view.classList.toggle("hidden", view.id !== `view-${tabName}`);
  });

  if (tabName === "admin") {
    activateAdminPane(activeAdminPane);
  }

  if (menuDropdown && !menuDropdown.classList.contains("hidden")) {
    menuDropdown.classList.add("hidden");
  }

  if (tabName === "scan-history") {
    refreshRuns().catch((error) => logActivity(String(error)));
  }

  if (tabName === "service-models") {
    refreshModels().catch((error) => logActivity(String(error)));
  }
}

function openModal(modal) {
  if (!modal) {
    return;
  }
  modal.classList.remove("hidden");
}

function closeModal(modal) {
  if (!modal) {
    return;
  }
  modal.classList.add("hidden");
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
  setProfileConfigForScanType("icmp");
  setProfileEditState(false);
}

async function loadAppData() {
  activateTab("inventory");
  await refreshRuns();
  await refreshInventoryFilterOptions();
  await refreshInventory();
  await refreshModels();
  await refreshUsers();
  await refreshProfiles();
  await refreshCloudConfig();
  await refreshSsoConfig();
}

function splitOptionalList(value) {
  const parsed = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return parsed.length ? parsed : null;
}

function splitOptionalLowerList(value) {
  const parsed = value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return parsed.length ? parsed : null;
}

function boolToSelectValue(value) {
  return value ? "true" : "false";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toReadableWords(raw) {
  return String(raw || "")
    .replace(/[._-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value) {
  return String(value || "")
    .split(" ")
    .filter(Boolean)
    .map((token) => {
      if (/^\d/.test(token)) {
        return token.toUpperCase();
      }
      if (token.length <= 3 && /^[a-z0-9]+$/i.test(token)) {
        return token.toUpperCase();
      }
      return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
    })
    .join(" ");
}

function singularizeTail(value) {
  if (value.endsWith("ies") && value.length > 4) {
    return `${value.slice(0, -3)}y`;
  }
  if (value.endsWith("sses") || value.endsWith("status")) {
    return value;
  }
  if (value.endsWith("s") && value.length > 3) {
    return value.slice(0, -1);
  }
  return value;
}

function prettifyProviderLabel(provider) {
  const raw = String(provider || "").trim();
  if (!raw) {
    return "";
  }

  const aliasMap = {
    aws: "AWS",
    azure: "Azure",
    gcp: "GCP",
    ibm: "IBM",
    vmware: "VMware",
  };

  const alias = aliasMap[raw.toLowerCase()];
  if (alias) {
    return alias;
  }

  return titleCase(toReadableWords(raw));
}

function prettifyItemTypeLabel(itemType) {
  const raw = String(itemType || "").trim();
  if (!raw) {
    return "";
  }

  let normalized = raw;
  if (normalized.includes("/")) {
    const parts = normalized.split("/").filter(Boolean);
    normalized = parts[parts.length - 1] || normalized;
  }

  if (normalized.includes(".")) {
    const parts = normalized.split(".").filter(Boolean);
    normalized = parts.length >= 2 ? parts.slice(-2).join(" ") : parts[0];
  }

  normalized = singularizeTail(normalized);
  return titleCase(toReadableWords(normalized));
}

function prettifyAttributeKey(key) {
  return titleCase(toReadableWords(key));
}

function formatCellValue(value) {
  if (value === null || value === undefined) {
    return "";
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

const INVENTORY_HIDDEN_ATTRIBUTE_KEYS = new Set([
  "id",
  "name",
  "type",
  "location",
  "properties",
]);

const INVENTORY_PRIORITIZED_ATTRIBUTE_KEYS = [
  "resource_group",
  "subscription_id",
  "api_version",
  "property_provisioningState",
  "identity_type",
  "principal_id",
  "tenant_id",
  "managed_by",
  "access_tier",
  "replication_type",
  "sku_name",
  "sku_tier",
  "sku_size",
  "sku_family",
  "sku_capacity",
  "storage_sku_name",
  "storage_sku_tier",
  "resource_kind",
  "kind",
  "zones",
  "extended_location",
  "is_hns_enabled",
  "minimum_tls_version",
  "https_only",
  "public_network_access",
  "allow_blob_public_access",
  "primary_location",
  "secondary_location",
  "status_of_primary",
  "status_of_secondary",
];

function inventoryItemTypesForProvider(provider = "") {
  const source = provider && inventoryProviderTypeMap[provider]
    ? inventoryProviderTypeMap[provider]
    : inventoryAllItemTypes;

  return (Array.isArray(source) ? source : []).slice().sort((left, right) => {
    const leftLabel = prettifyItemTypeLabel(left);
    const rightLabel = prettifyItemTypeLabel(right);
    return leftLabel.localeCompare(rightLabel);
  });
}

function syncInventoryItemTypeState(provider = "") {
  const itemTypes = inventoryItemTypesForProvider(provider);
  if (!itemTypes.length) {
    inventoryVisibleItemTypes = {};
    return;
  }

  const nextState = {};
  itemTypes.forEach((itemType) => {
    nextState[itemType] = inventoryVisibleItemTypes[itemType] !== false;
  });
  inventoryVisibleItemTypes = nextState;
}

function inventoryItemTypesFromRows(items) {
  return Array.from(
    new Set(
      (Array.isArray(items) ? items : [])
        .map((item) => String(item?.item_type || "").trim())
        .filter(Boolean),
    ),
  ).sort((left, right) => {
    const leftLabel = prettifyItemTypeLabel(left);
    const rightLabel = prettifyItemTypeLabel(right);
    return leftLabel.localeCompare(rightLabel);
  });
}

function filteredInventoryRows(items) {
  if (!Array.isArray(items) || !items.length) {
    return [];
  }

  const visibleTypes = new Set(
    Object.entries(inventoryVisibleItemTypes)
      .filter(([, isVisible]) => isVisible)
      .map(([itemType]) => itemType),
  );

  if (!visibleTypes.size) {
    return [];
  }

  return items.filter((item) => visibleTypes.has(String(item?.item_type || "").trim()));
}

function updateInventoryItemTypeButtonText() {
  if (!inventoryItemTypeMenuBtn) {
    return;
  }
  const totalCount = Object.keys(inventoryVisibleItemTypes).length;
  const visibleCount = Object.values(inventoryVisibleItemTypes).filter(Boolean).length;

  if (!totalCount) {
    inventoryItemTypeMenuBtn.textContent = "No item types";
    return;
  }

  if (visibleCount === totalCount) {
    inventoryItemTypeMenuBtn.textContent = "All item types";
    return;
  }

  if (!visibleCount) {
    inventoryItemTypeMenuBtn.textContent = "No item types selected";
    return;
  }

  inventoryItemTypeMenuBtn.textContent = `${visibleCount} of ${totalCount} selected`;
}

function renderInventoryItemTypeToggles() {
  if (!inventoryItemTypeOptions) {
    return;
  }

  const itemTypes = Object.keys(inventoryVisibleItemTypes);
  if (!itemTypes.length) {
    inventoryItemTypeOptions.innerHTML = '<span class="hint">No item types available.</span>';
    updateInventoryItemTypeButtonText();
    return;
  }

  inventoryItemTypeOptions.innerHTML = itemTypes
    .map((itemType) => {
      const isVisible = inventoryVisibleItemTypes[itemType] !== false;
      const checked = isVisible ? "checked" : "";
      return `<label class="row-filter-option" title="${escapeHtml(itemType)}"><input type="checkbox" data-item-type-toggle="${escapeHtml(itemType)}" ${checked} /> <span>${escapeHtml(prettifyItemTypeLabel(itemType))}</span></label>`;
    })
    .join("");

  inventoryItemTypeOptions.querySelectorAll("input[data-item-type-toggle]").forEach((input) => {
    input.addEventListener("change", () => {
      const itemType = String(input.dataset.itemTypeToggle || "");
      if (!itemType) {
        return;
      }
      inventoryVisibleItemTypes[itemType] = Boolean(input.checked);
      renderInventoryItemTypeToggles();
      renderInventoryResults(filteredInventoryRows(inventoryLatestItems), "No rows match selected filters.");
    });
  });

  updateInventoryItemTypeButtonText();
}

function setAllInventoryItemTypeToggles(isVisible) {
  Object.keys(inventoryVisibleItemTypes).forEach((itemType) => {
    inventoryVisibleItemTypes[itemType] = isVisible;
  });
  renderInventoryItemTypeToggles();
  renderInventoryResults(filteredInventoryRows(inventoryLatestItems), "No rows match selected filters.");
}

function inventoryAttributeKeysFromRows(items) {
  return Array.from(
    new Set(
      items.flatMap((item) => {
        if (!item || typeof item.attributes !== "object" || item.attributes === null || Array.isArray(item.attributes)) {
          return [];
        }
        return Object.keys(item.attributes).filter((key) => !INVENTORY_HIDDEN_ATTRIBUTE_KEYS.has(key));
      }),
    ),
  ).sort((left, right) => {
    const leftPriority = INVENTORY_PRIORITIZED_ATTRIBUTE_KEYS.indexOf(left);
    const rightPriority = INVENTORY_PRIORITIZED_ATTRIBUTE_KEYS.indexOf(right);

    if (leftPriority >= 0 || rightPriority >= 0) {
      if (leftPriority < 0) {
        return 1;
      }
      if (rightPriority < 0) {
        return -1;
      }
      return leftPriority - rightPriority;
    }

    return left.localeCompare(right);
  });
}

function syncInventoryAttributeState(items) {
  const attributeKeys = inventoryAttributeKeysFromRows(items);
  if (!attributeKeys.length) {
    inventoryVisibleAttributes = {};
    return;
  }

  const nextState = {};
  attributeKeys.forEach((key) => {
    nextState[key] = inventoryVisibleAttributes[key] !== false;
  });
  inventoryVisibleAttributes = nextState;
}

function updateInventoryAttributeFilterButtonText() {
  if (!inventoryAttributeFilterMenuBtn) {
    return;
  }

  const totalCount = Object.keys(inventoryVisibleAttributes).length;
  const visibleCount = Object.values(inventoryVisibleAttributes).filter(Boolean).length;

  if (!totalCount) {
    inventoryAttributeFilterMenuBtn.textContent = "No attributes";
    return;
  }

  if (visibleCount === totalCount) {
    inventoryAttributeFilterMenuBtn.textContent = "All attributes";
    return;
  }

  if (!visibleCount) {
    inventoryAttributeFilterMenuBtn.textContent = "No attributes selected";
    return;
  }

  inventoryAttributeFilterMenuBtn.textContent = `${visibleCount} of ${totalCount} selected`;
}

function renderInventoryAttributeToggles() {
  if (!inventoryAttributeFilterOptions) {
    return;
  }

  const attributeKeys = Object.keys(inventoryVisibleAttributes);
  if (!attributeKeys.length) {
    inventoryAttributeFilterOptions.innerHTML = '<span class="hint">No attributes available.</span>';
    updateInventoryAttributeFilterButtonText();
    return;
  }

  inventoryAttributeFilterOptions.innerHTML = attributeKeys
    .map((attributeKey) => {
      const isVisible = inventoryVisibleAttributes[attributeKey] !== false;
      const checked = isVisible ? "checked" : "";
      return `<label class="row-filter-option" title="${escapeHtml(attributeKey)}"><input type="checkbox" data-attribute-key-toggle="${escapeHtml(attributeKey)}" ${checked} /> <span>${escapeHtml(prettifyAttributeKey(attributeKey))}</span></label>`;
    })
    .join("");

  inventoryAttributeFilterOptions.querySelectorAll("input[data-attribute-key-toggle]").forEach((input) => {
    input.addEventListener("change", () => {
      const attributeKey = String(input.dataset.attributeKeyToggle || "");
      if (!attributeKey) {
        return;
      }
      inventoryVisibleAttributes[attributeKey] = Boolean(input.checked);
      renderInventoryAttributeToggles();
      renderInventoryResults(filteredInventoryRows(inventoryLatestItems), "No rows match selected filters.");
    });
  });

  updateInventoryAttributeFilterButtonText();
}

function setAllInventoryAttributeToggles(isVisible) {
  Object.keys(inventoryVisibleAttributes).forEach((key) => {
    inventoryVisibleAttributes[key] = isVisible;
  });
  renderInventoryAttributeToggles();
  renderInventoryResults(filteredInventoryRows(inventoryLatestItems), "No rows match selected filters.");
}

function renderInventoryTable(items, emptyMessage = "No inventory items found.") {
  if (!inventoryTableBody) {
    inventoryPanel.textContent = JSON.stringify(items, null, 2);
    return;
  }

  const baseColumns = [
    { key: "provider", label: "Provider" },
    { key: "item_type", label: "Type" },
    { key: "name", label: "Name" },
    { key: "region", label: "Region" },
    { key: "item_key", label: "Resource Key" },
    { key: "parent_key", label: "Parent" },
    { key: "discovered_at", label: "Discovered" },
  ];

  if (!Array.isArray(items) || !items.length) {
    if (inventoryTableHead) {
      inventoryTableHead.innerHTML = `<tr>${baseColumns.map((column) => `<th>${column.label}</th>`).join("")}</tr>`;
    }
    inventoryTableBody.innerHTML = `<tr><td colspan="${baseColumns.length}" class="empty-cell">${escapeHtml(emptyMessage)}</td></tr>`;
    return;
  }

  const attributeKeys = inventoryAttributeKeysFromRows(items).filter((key) => inventoryVisibleAttributes[key] !== false);

  const columns = [
    ...baseColumns,
    ...attributeKeys.map((key) => ({
      key: `attr:${key}`,
      label: prettifyAttributeKey(key),
      attributeKey: key,
    })),
  ];

  if (inventoryTableHead) {
    const headers = columns
      .map((column) => `<th title="${escapeHtml(column.label)}">${escapeHtml(column.label)}</th>`)
      .join("");
    inventoryTableHead.innerHTML = `<tr>${headers}</tr>`;
  }

  const rows = items
    .map((item) => {
      const discovered = item.discovered_at ? new Date(item.discovered_at).toLocaleString() : "";
      const attributes = item && typeof item.attributes === "object" && item.attributes !== null && !Array.isArray(item.attributes)
        ? item.attributes
        : {};

      const values = [
        prettifyProviderLabel(item.provider || ""),
        prettifyItemTypeLabel(item.item_type || ""),
        item.name || "",
        item.region || "",
        item.item_key || "",
        item.parent_key || "",
        discovered,
        ...attributeKeys.map((key) => formatCellValue(attributes[key])),
      ];

      const cells = values
        .map((value) => {
          const safeValue = escapeHtml(value);
          return `<td title="${safeValue}">${safeValue}</td>`;
        })
        .join("");

      return `
        <tr>
          ${cells}
        </tr>
      `;
    })
    .join("");

  inventoryTableBody.innerHTML = rows;
}

function renderInventoryCollectiveTable(items, emptyMessage = "No inventory items found.") {
  const summaryColumns = [
    { key: "provider", label: "Provider" },
    { key: "scope", label: "Account / Tenant" },
    { key: "item_type", label: "Type" },
    { key: "count", label: "Resource Count" },
    { key: "regions", label: "Regions" },
    { key: "latest_discovered", label: "Latest Discovered" },
  ];

  if (inventoryTableHead) {
    inventoryTableHead.innerHTML = `<tr>${summaryColumns.map((column) => `<th>${column.label}</th>`).join("")}</tr>`;
  }

  if (!Array.isArray(items) || !items.length) {
    inventoryTableBody.innerHTML = `<tr><td colspan="${summaryColumns.length}" class="empty-cell">${escapeHtml(emptyMessage)}</td></tr>`;
    return;
  }

  const grouped = new Map();

  const resolveResourceScope = (item) => {
    const provider = String(item?.provider || "").trim().toLowerCase();
    const attributes = item && typeof item.attributes === "object" && item.attributes !== null
      ? item.attributes
      : {};

    const pickFirst = (...values) => values.find((value) => String(value || "").trim()) || null;

    if (provider === "azure") {
      const tenantId = pickFirst(attributes.tenant_id, attributes.property_tenantId);
      if (tenantId) {
        const value = String(tenantId).trim();
        return { key: `tenant:${value}`, label: `Tenant ${value}` };
      }

      const subscriptionId = pickFirst(attributes.subscription_id, attributes.property_subscriptionId);
      if (subscriptionId) {
        const value = String(subscriptionId).trim();
        return { key: `subscription:${value}`, label: `Subscription ${value}` };
      }
    }

    if (provider === "aws") {
      const accountId = pickFirst(
        attributes.account_id,
        attributes.aws_account_id,
        attributes.owner_account_id,
        attributes.owner_id,
      );
      if (accountId) {
        const value = String(accountId).trim();
        return { key: `account:${value}`, label: `Account ${value}` };
      }
    }

    if (provider === "gcp") {
      const projectId = pickFirst(attributes.project_id, attributes.projectId);
      if (projectId) {
        const value = String(projectId).trim();
        return { key: `project:${value}`, label: `Project ${value}` };
      }
    }

    const genericScope = pickFirst(attributes.tenant_id, attributes.subscription_id, attributes.account_id);
    if (genericScope) {
      const value = String(genericScope).trim();
      return { key: `scope:${value}`, label: value };
    }

    return { key: "default", label: "Default" };
  };

  items.forEach((item) => {
    const provider = String(item?.provider || "").trim();
    const itemType = String(item?.item_type || "").trim();
    const scope = resolveResourceScope(item);
    const key = `${provider}||${scope.key}||${itemType}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        provider,
        scopeLabel: scope.label,
        itemType,
        count: 0,
        regions: new Set(),
        latestDiscoveredAt: null,
      });
    }

    const entry = grouped.get(key);
    entry.count += 1;

    const region = String(item?.region || "").trim();
    if (region) {
      entry.regions.add(region);
    }

    if (item?.discovered_at) {
      const discoveredAt = new Date(item.discovered_at);
      if (!Number.isNaN(discoveredAt.getTime())) {
        if (!entry.latestDiscoveredAt || discoveredAt > entry.latestDiscoveredAt) {
          entry.latestDiscoveredAt = discoveredAt;
        }
      }
    }
  });

  const rows = Array.from(grouped.values())
    .sort((left, right) => {
      const providerCompare = prettifyProviderLabel(left.provider).localeCompare(prettifyProviderLabel(right.provider));
      if (providerCompare !== 0) {
        return providerCompare;
      }
      const scopeCompare = left.scopeLabel.localeCompare(right.scopeLabel);
      if (scopeCompare !== 0) {
        return scopeCompare;
      }
      return prettifyItemTypeLabel(left.itemType).localeCompare(prettifyItemTypeLabel(right.itemType));
    })
    .map((entry) => {
      const latestDiscovered = entry.latestDiscoveredAt ? entry.latestDiscoveredAt.toLocaleString() : "";
      const regions = Array.from(entry.regions).sort().join(", ");

      const values = [
        prettifyProviderLabel(entry.provider),
        entry.scopeLabel,
        prettifyItemTypeLabel(entry.itemType),
        String(entry.count),
        regions,
        latestDiscovered,
      ];

      const cells = values
        .map((value) => {
          const safeValue = escapeHtml(value);
          return `<td title="${safeValue}">${safeValue}</td>`;
        })
        .join("");

      return `<tr>${cells}</tr>`;
    })
    .join("");

  inventoryTableBody.innerHTML = rows;
}

function renderInventoryResults(items, emptyMessage = "No inventory items found.") {
  syncInventoryAttributeState(items);
  renderInventoryAttributeToggles();

  const mode = String(inventoryViewMode?.value || "individual");
  if (mode === "collective") {
    renderInventoryCollectiveTable(items, emptyMessage);
    return;
  }
  renderInventoryTable(items, emptyMessage);
}

function toggleSecretRefProviderPanels() {
  const provider = secretRefProvider?.value;
  if (!provider) {
    return;
  }
  secretRefProviderEnv?.classList.toggle("hidden", provider !== "env");
  secretRefProviderAzure?.classList.toggle("hidden", provider !== "azure_key_vault");
  secretRefProviderAws?.classList.toggle("hidden", provider !== "aws_secrets_manager");
}

function buildSecretReferenceFromCatalogForm() {
  const fd = new FormData(secretRefForm);
  const provider = String(fd.get("provider") || "").trim();

  if (provider === "env") {
    return {
      $secret: {
        provider,
        key: String(fd.get("env_key") || "").trim(),
      },
    };
  }

  if (provider === "azure_key_vault") {
    const reference = {
      $secret: {
        provider,
        vault_url: String(fd.get("azure_vault_url") || "").trim(),
        name: String(fd.get("azure_name") || "").trim(),
      },
    };
    const version = String(fd.get("azure_version") || "").trim();
    if (version) {
      reference.$secret.version = version;
    }
    return reference;
  }

  if (provider === "aws_secrets_manager") {
    const reference = {
      $secret: {
        provider,
        secret_id: String(fd.get("aws_secret_id") || "").trim(),
      },
    };
    const region = String(fd.get("aws_region") || "").trim();
    const jsonKey = String(fd.get("aws_json_key") || "").trim();
    if (region) {
      reference.$secret.region = region;
    }
    if (jsonKey) {
      reference.$secret.json_key = jsonKey;
    }
    return reference;
  }

  throw new Error("Unsupported secret reference provider");
}

function parseSecretReference(secretRef) {
  return secretRef?.reference?.$secret || {};
}

function populateSecretRefSelect(select, options = {}) {
  if (!select) {
    return;
  }
  const allowEmpty = Boolean(options.allowEmpty);
  const emptyLabel = options.emptyLabel || "-- none --";

  select.innerHTML = "";
  if (allowEmpty) {
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = emptyLabel;
    select.appendChild(emptyOption);
  }

  secretReferences.forEach((item) => {
    const option = document.createElement("option");
    option.value = String(item.id);
    option.textContent = `${item.name} (${item.provider})`;
    select.appendChild(option);
  });
}

function setSecretRefModalState(editing, secretRef = null) {
  secretRefEditId = editing && secretRef ? secretRef.id : null;
  if (secretRefModalTitle) {
    secretRefModalTitle.textContent = editing ? "Edit Secret Reference" : "Create Secret Reference";
  }
  if (saveSecretRefBtn) {
    saveSecretRefBtn.textContent = editing ? "Update Reference" : "Create Reference";
  }

  secretRefForm?.reset();

  if (!editing || !secretRef) {
    toggleSecretRefProviderPanels();
    return;
  }

  secretRefForm.elements.name.value = secretRef.name;
  const parsed = parseSecretReference(secretRef);
  const provider = String(parsed.provider || "env");
  secretRefProvider.value = provider;
  toggleSecretRefProviderPanels();

  if (provider === "env") {
    secretRefForm.elements.env_key.value = parsed.key || "";
  }

  if (provider === "azure_key_vault") {
    secretRefForm.elements.azure_vault_url.value = parsed.vault_url || "";
    secretRefForm.elements.azure_name.value = parsed.name || "";
    secretRefForm.elements.azure_version.value = parsed.version || "";
  }

  if (provider === "aws_secrets_manager") {
    secretRefForm.elements.aws_secret_id.value = parsed.secret_id || "";
    secretRefForm.elements.aws_region.value = parsed.region || "";
    secretRefForm.elements.aws_json_key.value = parsed.json_key || "";
  }
}

function setAzureTenantModalState(editing, tenant = null) {
  azureTenantEditId = editing && tenant ? tenant.id : null;
  azureTenantCurrentSecretSource = editing && tenant ? tenant.client_secret_source : null;
  if (azureTenantModalTitle) {
    azureTenantModalTitle.textContent = editing ? "Edit Azure Tenant" : "Configure Azure Tenant";
  }
  if (saveAzureTenantBtn) {
    saveAzureTenantBtn.textContent = editing ? "Update Azure Tenant" : "Save Azure Tenant";
  }

  azureTenantForm?.reset();
  syncAzureSecretRefDropdown();
  populateAzureExistingProfileSelect();
  if (azureClientSecretMode) {
    azureClientSecretMode.value = "reference";
  }
  if (azureTenantProfileMode) {
    azureTenantProfileMode.value = "create_new";
  }
  if (azureInlineClientSecretInput) {
    azureInlineClientSecretInput.placeholder = "Enter Azure app client secret";
  }
  toggleAzureSecretModePanels();
  toggleAzureTenantProfilePanels();

  if (!editing || !tenant || !azureTenantForm) {
    if (azureTenantForm?.elements?.profile_name) {
      azureTenantForm.elements.profile_name.value = "";
    }
    return;
  }

  azureTenantForm.elements.name.value = tenant.name;
  azureTenantForm.elements.tenant_id.value = tenant.tenant_id;
  azureTenantForm.elements.client_id.value = tenant.client_id;
  if (tenant.client_secret_source === "encrypted") {
    if (azureClientSecretMode) {
      azureClientSecretMode.value = "inline_encrypted";
    }
    if (azureInlineClientSecretInput) {
      azureInlineClientSecretInput.placeholder = "Leave blank to keep current encrypted secret";
    }
  } else {
    if (azureClientSecretMode) {
      azureClientSecretMode.value = "reference";
    }
    if (tenant.client_secret_ref_id != null) {
      azureTenantForm.elements.client_secret_ref_id.value = String(tenant.client_secret_ref_id);
    }
  }
  toggleAzureSecretModePanels();

  const linkedProfiles = linkedAzureProfilesForTenant(tenant.id);
  if (linkedProfiles.length) {
    if (azureTenantProfileMode) {
      azureTenantProfileMode.value = "use_existing";
    }
    populateAzureExistingProfileSelect(linkedProfiles[0].id);
  } else {
    if (azureTenantProfileMode) {
      azureTenantProfileMode.value = "create_new";
    }
    if (azureTenantForm.elements.profile_name) {
      azureTenantForm.elements.profile_name.value = `azure-${tenant.name}-profile`;
    }
  }
  toggleAzureTenantProfilePanels();
  azureTenantForm.elements.subscription_ids.value = (tenant.subscription_ids || []).join(",");
  azureTenantForm.elements.is_active.value = boolToSelectValue(tenant.is_active);
}

function toggleAzureSecretModePanels() {
  const mode = String(azureClientSecretMode?.value || "reference");
  azureSecretRefPanel?.classList.toggle("hidden", mode !== "reference");
  azureInlineSecretPanel?.classList.toggle("hidden", mode !== "inline_encrypted");
}

function setAwsAccountModalState(editing, account = null) {
  awsAccountEditId = editing && account ? account.id : null;
  if (awsAccountModalTitle) {
    awsAccountModalTitle.textContent = editing ? "Edit AWS Account" : "Configure AWS Account";
  }
  if (saveAwsAccountBtn) {
    saveAwsAccountBtn.textContent = editing ? "Update AWS Account" : "Save AWS Account";
  }

  awsAccountForm?.reset();
  syncAwsSecretRefDropdowns();
  if (awsAuthMode) {
    awsAuthMode.value = !editing && !secretReferences.length ? "assume_role" : "access_key";
  }
  if (awsCredentialSource) {
    awsCredentialSource.value = !editing && !secretReferences.length ? "inline_encrypted" : "reference";
  }
  toggleAwsAuthModePanels();

  if (!editing || !account || !awsAccountForm) {
    return;
  }

  const accountAuthMode = String(account.auth_mode || "access_key");
  const accountCredentialSource = String(account.credential_source || "reference");
  if (awsAuthMode) {
    awsAuthMode.value = accountAuthMode;
  }
  if (awsCredentialSource) {
    awsCredentialSource.value = accountCredentialSource;
  }
  toggleAwsAuthModePanels();

  awsAccountForm.elements.name.value = account.name;
  if (accountAuthMode === "access_key") {
    if (accountCredentialSource === "reference") {
      awsAccountForm.elements.access_key_ref_id.value = account.access_key_ref_id != null
        ? String(account.access_key_ref_id)
        : "";
      awsAccountForm.elements.secret_access_key_ref_id.value = account.secret_access_key_ref_id != null
        ? String(account.secret_access_key_ref_id)
        : "";
    }
    awsAccountForm.elements.session_token_ref_id.value = account.session_token_ref_id != null
      ? String(account.session_token_ref_id)
      : "";
  } else {
    awsAccountForm.elements.role_arn.value = account.role_arn || "";
    awsAccountForm.elements.external_id.value = account.external_id || "";
  }

  awsAccountForm.elements.regions.value = (account.regions || []).join(",");
  awsAccountForm.elements.is_active.value = boolToSelectValue(account.is_active);
}

function renderSecretReferencesPanel() {
  if (!secretRefsPanel) {
    return;
  }
  if (!secretReferences.length) {
    secretRefsPanel.innerHTML = '<div class="list-item">No secret references configured.</div>';
    return;
  }

  secretRefsPanel.innerHTML = secretReferences
    .map(
      (item) => `
      <div class="list-item">
        <h4>${item.name}</h4>
        <div>Provider: ${item.provider}</div>
        <div class="mini-actions">
          <button data-edit-secret-ref="${item.id}">Edit</button>
          <button data-delete-secret-ref="${item.id}" class="secondary">Delete</button>
        </div>
      </div>
    `,
    )
    .join("");

  secretRefsPanel.querySelectorAll("button[data-edit-secret-ref]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.editSecretRef);
      const secretRef = secretReferences.find((item) => item.id === id);
      if (!secretRef) {
        return;
      }
      setSecretRefModalState(true, secretRef);
      openModal(secretRefModal);
    });
  });

  secretRefsPanel.querySelectorAll("button[data-delete-secret-ref]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = Number(button.dataset.deleteSecretRef);
      const secretRef = secretReferences.find((item) => item.id === id);
      if (!secretRef) {
        return;
      }
      if (!window.confirm(`Delete secret reference '${secretRef.name}'?`)) {
        return;
      }
      try {
        await apiFetch(`/api/admin/secret-references/${id}`, { method: "DELETE" });
        await refreshCloudConfig();
        logActivity(`Secret reference deleted: ${secretRef.name}`);
      } catch (error) {
        logActivity(`Failed to delete secret reference: ${String(error)}`);
      }
    });
  });
}

function syncAzureSecretRefDropdown() {
  populateSecretRefSelect(azureClientSecretRefSelect);
}

function linkedAzureProfilesForTenant(tenantId) {
  return scanProfiles.filter(
    (profile) => profile.scan_type === "azure" && Number(profile.config?.tenant_config_id) === Number(tenantId),
  );
}

function populateAzureExistingProfileSelect(selectedProfileId = null) {
  if (!azureTenantExistingProfileSelect) {
    return;
  }

  const azureProfiles = scanProfiles.filter((profile) => profile.scan_type === "azure");
  azureTenantExistingProfileSelect.innerHTML = '<option value="">-- select a scanning profile --</option>';
  azureProfiles.forEach((profile) => {
    const option = document.createElement("option");
    option.value = String(profile.id);
    option.textContent = `${profile.name} (${profile.schedule_minutes} min)`;
    azureTenantExistingProfileSelect.appendChild(option);
  });

  if (selectedProfileId != null) {
    azureTenantExistingProfileSelect.value = String(selectedProfileId);
  }
}

function toggleAzureTenantProfilePanels() {
  const mode = String(azureTenantProfileMode?.value || "create_new");
  azureTenantProfileCreatePanel?.classList.toggle("hidden", mode !== "create_new");
  azureTenantProfileExistingPanel?.classList.toggle("hidden", mode !== "use_existing");
}

function syncAwsSecretRefDropdowns() {
  populateSecretRefSelect(awsAccessKeyRefSelect);
  populateSecretRefSelect(awsSecretAccessKeyRefSelect);
  populateSecretRefSelect(awsSessionTokenRefSelect, { allowEmpty: true, emptyLabel: "-- no session token --" });
}

function syncGcpSecretRefDropdown() {
  populateSecretRefSelect(gcpServiceAccountRefSelect);
}

function syncSsoSecretRefDropdown() {
  populateSecretRefSelect(ssoClientSecretRefSelect, { allowEmpty: true, emptyLabel: "-- none --" });
}

function toggleSsoSecretModePanels() {
  const mode = String(ssoClientSecretMode?.value || "reference");
  ssoSecretRefPanel?.classList.toggle("hidden", mode !== "reference");
  ssoInlineSecretPanel?.classList.toggle("hidden", mode !== "inline_encrypted");
}

function setSsoConfigForm(config) {
  ssoConfig = config || null;
  ssoCurrentSecretSource = String(config?.client_secret_source || "none");

  if (!ssoConfigForm) {
    return;
  }

  ssoConfigForm.reset();
  syncSsoSecretRefDropdown();

  ssoConfigForm.elements.is_enabled.value = boolToSelectValue(Boolean(config?.is_enabled));
  ssoConfigForm.elements.default_role.value = String(config?.default_role || "user");
  ssoConfigForm.elements.tenant_id.value = String(config?.tenant_id || "");
  ssoConfigForm.elements.client_id.value = String(config?.client_id || "");
  ssoConfigForm.elements.redirect_uri.value = String(config?.redirect_uri || "");
  ssoConfigForm.elements.role_claim_key.value = String(config?.role_claim_key || "groups");
  ssoConfigForm.elements.admin_group_ids.value = Array.isArray(config?.admin_group_ids)
    ? config.admin_group_ids.join(",")
    : "";
  ssoConfigForm.elements.user_group_ids.value = Array.isArray(config?.user_group_ids)
    ? config.user_group_ids.join(",")
    : "";
  ssoConfigForm.elements.admin_emails.value = Array.isArray(config?.admin_emails)
    ? config.admin_emails.join(",")
    : "";

  if (String(config?.client_secret_source || "none") === "encrypted") {
    if (ssoClientSecretMode) {
      ssoClientSecretMode.value = "inline_encrypted";
    }
    if (ssoInlineClientSecretInput) {
      ssoInlineClientSecretInput.placeholder = "Leave blank to keep current encrypted secret";
    }
  } else {
    if (ssoClientSecretMode) {
      ssoClientSecretMode.value = "reference";
    }
    ssoConfigForm.elements.client_secret_ref_id.value = config?.client_secret_ref_id != null
      ? String(config.client_secret_ref_id)
      : "";
    if (ssoInlineClientSecretInput) {
      ssoInlineClientSecretInput.placeholder = "Enter Entra app client secret";
    }
  }

  toggleSsoSecretModePanels();

  if (ssoConfigSummary) {
    ssoConfigSummary.textContent = JSON.stringify(config || { source: "disabled" }, null, 2);
  }
}

async function refreshSsoConfig() {
  if (currentUser?.role !== "admin") {
    return;
  }

  const config = await apiFetch("/api/admin/sso-config");
  setSsoConfigForm(config);
}

function toggleGcpServiceAccountPanels() {
  const mode = String(gcpServiceAccountMode?.value || "reference");
  gcpServiceAccountRefPanel?.classList.toggle("hidden", mode !== "reference");
  gcpServiceAccountInlinePanel?.classList.toggle("hidden", mode !== "inline_encrypted");
}

function setGcpAccountModalState(editing, account = null) {
  gcpAccountEditId = editing && account ? account.id : null;
  gcpAccountCurrentSecretSource = editing && account ? account.service_account_source : null;

  if (gcpAccountModalTitle) {
    gcpAccountModalTitle.textContent = editing ? "Edit GCP Account" : "Configure GCP Account";
  }
  if (saveGcpAccountBtn) {
    saveGcpAccountBtn.textContent = editing ? "Update GCP Account" : "Save GCP Account";
  }

  gcpAccountForm?.reset();
  syncGcpSecretRefDropdown();
  if (gcpServiceAccountMode) {
    gcpServiceAccountMode.value = "reference";
  }
  if (gcpInlineServiceAccountJsonInput) {
    gcpInlineServiceAccountJsonInput.placeholder = '{"type":"service_account", ...}';
  }
  toggleGcpServiceAccountPanels();

  if (!editing || !account || !gcpAccountForm) {
    return;
  }

  gcpAccountForm.elements.name.value = account.name;
  if (account.service_account_source === "encrypted") {
    if (gcpServiceAccountMode) {
      gcpServiceAccountMode.value = "inline_encrypted";
    }
    if (gcpInlineServiceAccountJsonInput) {
      gcpInlineServiceAccountJsonInput.placeholder = "Leave blank to keep current encrypted value";
    }
  } else {
    if (gcpServiceAccountMode) {
      gcpServiceAccountMode.value = "reference";
    }
    gcpAccountForm.elements.service_account_ref_id.value = account.service_account_ref_id != null
      ? String(account.service_account_ref_id)
      : "";
  }
  toggleGcpServiceAccountPanels();

  gcpAccountForm.elements.project_ids.value = (account.project_ids || []).join(",");
  gcpAccountForm.elements.is_active.value = boolToSelectValue(account.is_active);
}

function toggleAwsCredentialSourcePanels() {
  const source = String(awsCredentialSource?.value || "reference");
  const useReference = source === "reference";

  awsAccessKeyRefPanel?.classList.toggle("hidden", !useReference);
  awsAccessKeyInlinePanel?.classList.toggle("hidden", useReference);

  if (awsAccessKeyRefSelect) {
    awsAccessKeyRefSelect.required = useReference;
  }
  if (awsSecretAccessKeyRefSelect) {
    awsSecretAccessKeyRefSelect.required = useReference;
  }
  if (awsAccessKeyIdInput) {
    awsAccessKeyIdInput.required = !useReference;
  }
  if (awsSecretAccessKeyInput) {
    awsSecretAccessKeyInput.required = !useReference;
  }
}

function toggleAwsAuthModePanels() {
  const mode = String(awsAuthMode?.value || "access_key");
  const isAccessKey = mode === "access_key";

  awsAccessKeyPanel?.classList.toggle("hidden", !isAccessKey);
  awsAssumeRolePanel?.classList.toggle("hidden", isAccessKey);

  if (!isAccessKey) {
    if (awsAccessKeyRefSelect) {
      awsAccessKeyRefSelect.required = false;
    }
    if (awsSecretAccessKeyRefSelect) {
      awsSecretAccessKeyRefSelect.required = false;
    }
    if (awsAccessKeyIdInput) {
      awsAccessKeyIdInput.required = false;
    }
    if (awsSecretAccessKeyInput) {
      awsSecretAccessKeyInput.required = false;
    }
  } else {
    toggleAwsCredentialSourcePanels();
  }

  if (awsRoleArnInput) {
    awsRoleArnInput.required = !isAccessKey;
  }
}

function renderAzureTenantsPanel() {
  if (!azureTenantsPanel) {
    return;
  }
  if (!azureTenants.length) {
    azureTenantsPanel.innerHTML = '<div class="list-item">No Azure tenants configured.</div>';
    return;
  }

  azureTenantsPanel.innerHTML = azureTenants
    .map(
      (tenant) => {
        const linkedProfiles = linkedAzureProfilesForTenant(tenant.id);
        const linkedProfileLabel = linkedProfiles.length
          ? linkedProfiles.map((profile) => profile.name).join(", ")
          : "none";
        return `
      <div class="list-item">
        <h4>${tenant.name}</h4>
        <div>Tenant ID: ${tenant.tenant_id}</div>
        <div>Client ID: ${tenant.client_id}</div>
        <div>Secret: ${tenant.client_secret_ref_name || "unknown"}</div>
        <div>Secret Source: ${tenant.client_secret_source}</div>
        <div>Azure Profiles: ${linkedProfileLabel}</div>
        <div>Active: ${tenant.is_active}</div>
        <div class="mini-actions">
          <button data-edit-azure-tenant="${tenant.id}">Edit</button>
          <button data-delete-azure-tenant="${tenant.id}" class="secondary">Delete</button>
        </div>
      </div>
    `;
      },
    )
    .join("");

  azureTenantsPanel.querySelectorAll("button[data-edit-azure-tenant]").forEach((button) => {
    button.addEventListener("click", () => {
      const tenantId = Number(button.dataset.editAzureTenant);
      const tenant = azureTenants.find((item) => item.id === tenantId);
      if (!tenant) {
        return;
      }
      setAzureTenantModalState(true, tenant);
      openModal(azureTenantModal);
    });
  });

  azureTenantsPanel.querySelectorAll("button[data-delete-azure-tenant]").forEach((button) => {
    button.addEventListener("click", async () => {
      const tenantId = Number(button.dataset.deleteAzureTenant);
      const tenant = azureTenants.find((item) => item.id === tenantId);
      if (!tenant) {
        return;
      }
      if (!window.confirm(`Delete Azure tenant '${tenant.name}'?`)) {
        return;
      }
      try {
        await apiFetch(`/api/admin/azure-tenants/${tenantId}`, { method: "DELETE" });
        await refreshCloudConfig();
        logActivity(`Azure tenant deleted: ${tenant.name}`);
      } catch (error) {
        logActivity(`Failed to delete Azure tenant: ${String(error)}`);
      }
    });
  });
}

function renderAwsAccountsPanel() {
  if (!awsAccountsPanel) {
    return;
  }
  if (!awsAccounts.length) {
    awsAccountsPanel.innerHTML = '<div class="list-item">No AWS accounts configured.</div>';
    return;
  }

  awsAccountsPanel.innerHTML = awsAccounts
    .map(
      (account) => {
        const authModeLabel = account.auth_mode === "assume_role" ? "Assume role" : "Access key";
        const credentialSourceLabel = account.credential_source === "inline_encrypted"
          ? "Direct Credentials (encrypted)"
          : "Secret Reference";
        const authDetails = account.auth_mode === "assume_role"
          ? `
        <div>Role ARN: ${account.role_arn || "not set"}</div>
        <div>External ID: ${account.external_id || "none"}</div>
      `
          : `
        <div>Credential Source: ${credentialSourceLabel}</div>
        <div>Access Ref: ${account.access_key_ref_name}</div>
        <div>Secret Ref: ${account.secret_access_key_ref_name}</div>
        <div>Session Ref: ${account.session_token_ref_name || "none"}</div>
      `;

        return `
      <div class="list-item">
        <h4>${account.name}</h4>
        <div>Auth Mode: ${authModeLabel}</div>
        ${authDetails}
        <div>Regions: ${(account.regions || []).join(", ") || "all"}</div>
        <div>Active: ${account.is_active}</div>
        <div class="mini-actions">
          <button data-edit-aws-account="${account.id}">Edit</button>
          <button data-delete-aws-account="${account.id}" class="secondary">Delete</button>
        </div>
      </div>
    `;
      },
    )
    .join("");

  awsAccountsPanel.querySelectorAll("button[data-edit-aws-account]").forEach((button) => {
    button.addEventListener("click", () => {
      const accountId = Number(button.dataset.editAwsAccount);
      const account = awsAccounts.find((item) => item.id === accountId);
      if (!account) {
        return;
      }
      setAwsAccountModalState(true, account);
      openModal(awsAccountModal);
    });
  });

  awsAccountsPanel.querySelectorAll("button[data-delete-aws-account]").forEach((button) => {
    button.addEventListener("click", async () => {
      const accountId = Number(button.dataset.deleteAwsAccount);
      const account = awsAccounts.find((item) => item.id === accountId);
      if (!account) {
        return;
      }
      if (!window.confirm(`Delete AWS account '${account.name}'?`)) {
        return;
      }
      try {
        await apiFetch(`/api/admin/aws-accounts/${accountId}`, { method: "DELETE" });
        await refreshCloudConfig();
        logActivity(`AWS account deleted: ${account.name}`);
      } catch (error) {
        logActivity(`Failed to delete AWS account: ${String(error)}`);
      }
    });
  });
}

function renderGcpAccountsPanel() {
  if (!gcpAccountsPanel) {
    return;
  }
  if (!gcpAccounts.length) {
    gcpAccountsPanel.innerHTML = '<div class="list-item">No GCP accounts configured.</div>';
    return;
  }

  gcpAccountsPanel.innerHTML = gcpAccounts
    .map(
      (account) => {
        const sourceLabel = account.service_account_source === "encrypted"
          ? "Direct JSON (encrypted)"
          : "Secret Reference";
        return `
      <div class="list-item">
        <h4>${account.name}</h4>
        <div>Service Account Source: ${sourceLabel}</div>
        <div>Service Account Ref: ${account.service_account_ref_name || "unknown"}</div>
        <div>Projects: ${(account.project_ids || []).join(", ") || "auto-discover"}</div>
        <div>Active: ${account.is_active}</div>
        <div class="mini-actions">
          <button data-edit-gcp-account="${account.id}">Edit</button>
          <button data-delete-gcp-account="${account.id}" class="secondary">Delete</button>
        </div>
      </div>
    `;
      },
    )
    .join("");

  gcpAccountsPanel.querySelectorAll("button[data-edit-gcp-account]").forEach((button) => {
    button.addEventListener("click", () => {
      const accountId = Number(button.dataset.editGcpAccount);
      const account = gcpAccounts.find((item) => item.id === accountId);
      if (!account) {
        return;
      }
      setGcpAccountModalState(true, account);
      openModal(gcpAccountModal);
    });
  });

  gcpAccountsPanel.querySelectorAll("button[data-delete-gcp-account]").forEach((button) => {
    button.addEventListener("click", async () => {
      const accountId = Number(button.dataset.deleteGcpAccount);
      const account = gcpAccounts.find((item) => item.id === accountId);
      if (!account) {
        return;
      }
      if (!window.confirm(`Delete GCP account '${account.name}'?`)) {
        return;
      }

      try {
        await apiFetch(`/api/admin/gcp-accounts/${accountId}`, { method: "DELETE" });
        await refreshCloudConfig();
        logActivity(`GCP account deleted: ${account.name}`);
      } catch (error) {
        logActivity(`Failed to delete GCP account: ${String(error)}`);
      }
    });
  });
}

async function refreshCloudConfig() {
  if (currentUser?.role !== "admin") {
    return;
  }

  const [refs, tenants, aws, gcp, profiles] = await Promise.all([
    apiFetch("/api/admin/secret-references"),
    apiFetch("/api/admin/azure-tenants"),
    apiFetch("/api/admin/aws-accounts"),
    apiFetch("/api/admin/gcp-accounts"),
    apiFetch("/api/admin/scan-profiles"),
  ]);

  secretReferences = refs;
  azureTenants = tenants;
  awsAccounts = Array.isArray(aws) ? aws : [];
  gcpAccounts = Array.isArray(gcp) ? gcp : [];
  scanProfiles = Array.isArray(profiles) ? profiles : scanProfiles;

  renderSecretReferencesPanel();
  syncAzureSecretRefDropdown();
  syncAwsSecretRefDropdowns();
  syncGcpSecretRefDropdown();
  syncSsoSecretRefDropdown();
  renderAzureTenantsPanel();
  renderAwsAccountsPanel();
  renderGcpAccountsPanel();
  renderProfileQuickSettings();
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

async function refreshInventoryFilterOptions() {
  if (!inventoryProviderFilter) {
    return;
  }

  const previousProvider = String(inventoryProviderFilter.value || "");

  const options = await apiFetch("/api/inventory/filter-options");
  const providers = Array.isArray(options.providers) ? options.providers : [];
  const providerTypeMap = options.provider_item_types && typeof options.provider_item_types === "object"
    ? options.provider_item_types
    : {};
  const allItemTypes = Array.isArray(options.item_types) ? options.item_types : [];

  inventoryProviderTypeMap = providerTypeMap;
  inventoryAllItemTypes = allItemTypes;

  inventoryProviderFilter.innerHTML = '<option value="">All providers</option>';
  providers.forEach((provider) => {
    const option = document.createElement("option");
    option.value = provider;
    option.textContent = prettifyProviderLabel(provider);
    inventoryProviderFilter.appendChild(option);
  });

  if (previousProvider && providers.includes(previousProvider)) {
    inventoryProviderFilter.value = previousProvider;
  }

  syncInventoryItemTypeState(String(inventoryProviderFilter.value || ""));
  renderInventoryItemTypeToggles();
}

async function refreshInventory(provider, search) {
  const resolvedProvider = provider !== undefined ? provider : String(inventoryProviderFilter?.value || "");
  const resolvedSearch = search !== undefined ? search : String(inventoryFilterForm?.elements?.search?.value || "");

  const params = new URLSearchParams();
  params.set("limit", "300");
  if (resolvedProvider) {
    params.set("provider", resolvedProvider);
  }
  if (resolvedSearch) {
    params.set("search", resolvedSearch);
  }

  const items = await apiFetch(`/api/inventory/items?${params.toString()}`);
  inventoryLatestItems = Array.isArray(items) ? items : [];

  syncInventoryItemTypeState(resolvedProvider);
  renderInventoryItemTypeToggles();
  renderInventoryResults(
    filteredInventoryRows(inventoryLatestItems),
    inventoryLatestItems.length ? "No rows match selected filters." : "No inventory items found.",
  );
}

function selectedServiceModel() {
  return serviceModels.find((service) => Number(service.id) === Number(selectedServiceModelId)) || null;
}

function setServiceModelFormState(service = null) {
  if (!serviceModelForm || !serviceModelNameInput || !serviceModelDescriptionInput || !serviceModelIsActiveSelect) {
    return;
  }

  if (!service) {
    serviceModelForm.reset();
    serviceModelNameInput.value = "";
    serviceModelDescriptionInput.value = "";
    serviceModelIsActiveSelect.value = "true";
    if (saveServiceModelBtn) {
      saveServiceModelBtn.textContent = "Save Service";
    }
    if (deleteServiceModelBtn) {
      deleteServiceModelBtn.disabled = true;
    }
    return;
  }

  serviceModelNameInput.value = String(service.name || "");
  serviceModelDescriptionInput.value = String(service.description || "");
  serviceModelIsActiveSelect.value = service.is_active ? "true" : "false";
  if (saveServiceModelBtn) {
    saveServiceModelBtn.textContent = "Update Service";
  }
  if (deleteServiceModelBtn) {
    deleteServiceModelBtn.disabled = false;
  }
}

function renderServiceModelList() {
  if (!serviceModelListPanel) {
    return;
  }

  if (!serviceModels.length) {
    serviceModelListPanel.innerHTML = '<div class="list-item">No services in catalogue yet.</div>';
    return;
  }

  serviceModelListPanel.innerHTML = serviceModels
    .map((service) => {
      const isSelected = Number(service.id) === Number(selectedServiceModelId);
      return `
      <div class="list-item">
        <h4>${escapeHtml(service.name)}</h4>
        <div>Active: ${String(Boolean(service.is_active))}</div>
        <div>Resources: ${Number(service.resource_count || 0)}</div>
        <div>Dependencies: ${Number(service.dependency_count || 0)}</div>
        <div>Dependants: ${Number(service.dependant_count || 0)}</div>
        <div class="mini-actions">
          <button data-service-model-select-id="${service.id}" ${isSelected ? "disabled" : ""}>${isSelected ? "Selected" : "Open"}</button>
        </div>
      </div>
    `;
    })
    .join("");

  serviceModelListPanel.querySelectorAll("button[data-service-model-select-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      selectedServiceModelId = Number(button.dataset.serviceModelSelectId);
      renderServiceModelList();
      syncServiceModelPanels();
      await refreshServiceInventoryCandidates();
    });
  });
}

function renderServiceDependencyTargetOptions() {
  if (!dependencyTargetServiceSelect) {
    return;
  }

  const selectedId = Number(selectedServiceModelId || 0);
  const options = ['<option value="">-- select service --</option>'];
  serviceModels.forEach((service) => {
    if (Number(service.id) === selectedId) {
      return;
    }
    options.push(`<option value="${service.id}">${escapeHtml(service.name)}</option>`);
  });
  dependencyTargetServiceSelect.innerHTML = options.join("");
}

function renderServiceResourcesPanel(service) {
  if (!serviceResourcesPanel) {
    return;
  }

  const resources = Array.isArray(service?.resources) ? service.resources : [];
  if (!resources.length) {
    serviceResourcesPanel.innerHTML = '<div class="list-item">No resources attached.</div>';
    return;
  }

  serviceResourcesPanel.innerHTML = resources
    .map((resource) => `
      <div class="list-item">
        <h4>${escapeHtml(resource.name || resource.inventory_item_key)}</h4>
        <div>Type: ${escapeHtml(resource.item_type || "unknown")}</div>
        <div>Provider: ${escapeHtml(resource.provider || "unknown")}</div>
        <div>Key: ${escapeHtml(resource.inventory_item_key)}</div>
        <div class="mini-actions">
          <button data-service-resource-remove-id="${resource.id}" class="secondary">Detach</button>
        </div>
      </div>
    `)
    .join("");

  serviceResourcesPanel.querySelectorAll("button[data-service-resource-remove-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const resourceId = Number(button.dataset.serviceResourceRemoveId);
      if (!Number.isInteger(resourceId) || !selectedServiceModelId) {
        return;
      }

      try {
        await apiFetch(`/api/service-models/catalog/${selectedServiceModelId}/resources/${resourceId}`, {
          method: "DELETE",
        });
        await refreshModels();
        await refreshServiceInventoryCandidates();
        logActivity("Service resource detached");
      } catch (error) {
        logActivity(`Failed to detach service resource: ${String(error)}`);
      }
    });
  });
}

function renderServiceDependenciesPanel(service) {
  if (!serviceDependenciesPanel) {
    return;
  }

  const dependencies = Array.isArray(service?.dependencies) ? service.dependencies : [];
  const dependants = Array.isArray(service?.dependants) ? service.dependants : [];

  const outgoingHtml = dependencies.length
    ? dependencies
        .map((dependency) => `
      <div class="list-item">
        <h4>${escapeHtml(dependency.depends_on_service_name)}</h4>
        <div>Relation: ${escapeHtml(dependency.relation)}</div>
        <div class="mini-actions">
          <button data-service-dependency-remove-id="${dependency.id}" class="secondary">Remove</button>
        </div>
      </div>
    `)
        .join("")
    : '<div class="list-item">No direct dependencies defined.</div>';

  const inboundHtml = dependants.length
    ? dependants
        .map((dependant) => `
      <div class="list-item">
        <h4>${escapeHtml(dependant.service_name)}</h4>
        <div>Relation: ${escapeHtml(dependant.relation)}</div>
      </div>
    `)
        .join("")
    : '<div class="list-item">No services depend on this model.</div>';

  serviceDependenciesPanel.innerHTML = `
    <h4 class="small-head">Depends On</h4>
    ${outgoingHtml}
    <h4 class="small-head">Dependant Services</h4>
    ${inboundHtml}
  `;

  serviceDependenciesPanel.querySelectorAll("button[data-service-dependency-remove-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const dependencyId = Number(button.dataset.serviceDependencyRemoveId);
      if (!Number.isInteger(dependencyId) || !selectedServiceModelId) {
        return;
      }

      try {
        await apiFetch(`/api/service-models/catalog/${selectedServiceModelId}/dependencies/${dependencyId}`, {
          method: "DELETE",
        });
        await refreshModels();
        logActivity("Service dependency removed");
      } catch (error) {
        logActivity(`Failed to remove dependency: ${String(error)}`);
      }
    });
  });
}

function renderServiceInventoryCandidates() {
  if (!serviceInventoryCandidatesPanel) {
    return;
  }

  const hasSearchTerm = Boolean(String(serviceResourceSearchInput?.value || "").trim());
  if (!hasSearchTerm) {
    serviceInventoryCandidatesPanel.innerHTML = '<div class="list-item">Type a search term to find inventory resources.</div>';
    updateAttachResourceButtonState();
    return;
  }

  if (!serviceInventoryCandidates.length) {
    serviceInventoryCandidatesPanel.innerHTML = '<div class="list-item">No inventory matches this filter.</div>';
    updateAttachResourceButtonState();
    return;
  }

  const selectedService = selectedServiceModel();
  const attachedKeys = new Set((selectedService?.resources || []).map((resource) => String(resource.inventory_item_key)));

  serviceInventoryCandidatesPanel.innerHTML = serviceInventoryCandidates
    .map((item) => {
      const itemKey = String(item.item_key || "");
      const isAttached = attachedKeys.has(itemKey);
      const isDisabled = isAttached;
      return `
      <div class="list-item">
        <h4>${escapeHtml(item.name || itemKey)}</h4>
        <div>Type: ${escapeHtml(item.item_type || "unknown")}</div>
        <label>
          <input type="checkbox" data-service-candidate-key="${encodeURIComponent(itemKey)}" ${isDisabled ? "disabled" : ""} />
          ${isAttached ? "Already attached" : "Select for attach"}
        </label>
      </div>
    `;
    })
    .join("");

  updateAttachResourceButtonState();
}

function updateAttachResourceButtonState() {
  if (!attachSelectedResourcesBtn) {
    return;
  }

  const selectedService = selectedServiceModel();
  const hasSearchTerm = Boolean(String(serviceResourceSearchInput?.value || "").trim());
  const selectedCount = Array.from(
    serviceInventoryCandidatesPanel?.querySelectorAll("input[data-service-candidate-key]:checked") || []
  ).length;

  if (!hasSearchTerm) {
    attachSelectedResourcesBtn.disabled = true;
    attachSelectedResourcesBtn.textContent = "Search to Find Resources";
    return;
  }

  if (!selectedService) {
    attachSelectedResourcesBtn.disabled = true;
    attachSelectedResourcesBtn.textContent = selectedCount > 0
      ? `Select a Service to Attach (${selectedCount} selected)`
      : "Select a Service to Attach";
    return;
  }

  attachSelectedResourcesBtn.disabled = selectedCount === 0;
  attachSelectedResourcesBtn.textContent = selectedCount > 0
    ? `Attach Selected Resources (${selectedCount})`
    : "Attach Selected Resources";
}

function syncServiceModelPanels() {
  const selected = selectedServiceModel();
  setServiceModelFormState(selected);
  renderServiceDependencyTargetOptions();
  renderServiceResourcesPanel(selected);
  renderServiceDependenciesPanel(selected);
  renderServiceInventoryCandidates();
  updateAttachResourceButtonState();
}

async function refreshServiceInventoryCandidates() {
  const search = String(serviceResourceSearchInput?.value || "").trim();
  if (!search) {
    serviceInventoryCandidates = [];
    renderServiceInventoryCandidates();
    return;
  }

  const params = new URLSearchParams();
  params.set("limit", "300");
  params.set("include_history", "false");
  const provider = String(serviceResourceProviderSelect?.value || "").trim();
  params.set("search", search);
  if (provider) {
    params.set("provider", provider);
  }

  const items = await apiFetch(`/api/inventory/items?${params.toString()}`);
  serviceInventoryCandidates = Array.isArray(items) ? items : [];
  renderServiceInventoryCandidates();
}

async function refreshModels() {
  const [model, catalog] = await Promise.all([
    apiFetch("/api/service-models/overview"),
    apiFetch("/api/service-models/catalog"),
  ]);

  modelsPanel.textContent = JSON.stringify(model, null, 2);
  serviceModels = Array.isArray(catalog) ? catalog : [];

  if (selectedServiceModelId && !serviceModels.some((service) => Number(service.id) === Number(selectedServiceModelId))) {
    selectedServiceModelId = null;
  }

  if (!selectedServiceModelId && serviceModels.length) {
    selectedServiceModelId = serviceModels[0].id;
  }

  renderServiceModelList();
  syncServiceModelPanels();
  await refreshServiceInventoryCandidates();
}

async function refreshUsers() {
  if (currentUser?.role !== "admin") {
    return;
  }
  const users = await apiFetch("/api/admin/users");
  renderUsersList(Array.isArray(users) ? users : []);
}

function renderUsersList(users) {
  if (!usersListPanel) {
    return;
  }

  if (!Array.isArray(users) || !users.length) {
    usersListPanel.innerHTML = '<div class="list-item">No users found.</div>';
    return;
  }

  usersListPanel.innerHTML = users
    .map((user) => {
      const isCurrentUser = Number(currentUser?.id) === Number(user.id);
      const nextRole = user.role === "admin" ? "user" : "admin";
      const nextActive = !user.is_active;
      const statusActionLabel = nextActive ? "Enable" : "Disable";

      return `
      <div class="list-item">
        <h4>${escapeHtml(user.username)}${isCurrentUser ? " (you)" : ""}</h4>
        <div>Email: ${escapeHtml(user.email || "-")}</div>
        <div>Provider: ${escapeHtml(user.provider)}</div>
        <div>Role: ${escapeHtml(user.role)}</div>
        <div>Active: ${String(Boolean(user.is_active))}</div>
        <div class="mini-actions">
          <button data-user-role-id="${user.id}" data-user-next-role="${nextRole}" ${isCurrentUser ? "" : ""}>Set ${escapeHtml(nextRole)}</button>
          <button data-user-status-id="${user.id}" data-user-next-active="${nextActive}" class="secondary">${statusActionLabel}</button>
          <button data-user-delete-id="${user.id}" class="secondary" ${isCurrentUser ? "disabled" : ""}>Delete</button>
        </div>
      </div>
    `;
    })
    .join("");

  usersListPanel.querySelectorAll("button[data-user-role-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const userId = Number(button.dataset.userRoleId);
      const nextRole = String(button.dataset.userNextRole || "user");

      try {
        await apiFetch(`/api/admin/users/${userId}/role?role=${encodeURIComponent(nextRole)}`, {
          method: "PUT",
        });
        await refreshUsers();
        logActivity(`User role updated: ${userId} -> ${nextRole}`);
      } catch (error) {
        logActivity(`Failed to update user role: ${String(error)}`);
      }
    });
  });

  usersListPanel.querySelectorAll("button[data-user-status-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const userId = Number(button.dataset.userStatusId);
      const nextActive = String(button.dataset.userNextActive || "false") === "true";

      try {
        await apiFetch(`/api/admin/users/${userId}/status?is_active=${nextActive ? "true" : "false"}`, {
          method: "PUT",
        });
        await refreshUsers();
        logActivity(`User status updated: ${userId} -> ${nextActive ? "enabled" : "disabled"}`);
      } catch (error) {
        logActivity(`Failed to update user status: ${String(error)}`);
      }
    });
  });

  usersListPanel.querySelectorAll("button[data-user-delete-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const userId = Number(button.dataset.userDeleteId);
      const targetUser = users.find((item) => Number(item.id) === userId);
      if (!targetUser) {
        return;
      }

      if (!window.confirm(`Delete user '${targetUser.username}'?`)) {
        return;
      }

      try {
        await apiFetch(`/api/admin/users/${userId}`, {
          method: "DELETE",
        });
        await refreshUsers();
        logActivity(`User deleted: ${targetUser.username}`);
      } catch (error) {
        logActivity(`Failed to delete user: ${String(error)}`);
      }
    });
  });
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
        <button data-delete-id="${profile.id}" class="secondary">Delete</button>
      </div>
    </div>
  `;
}

async function refreshProfiles() {
  if (currentUser?.role !== "admin") {
    return;
  }
  const profiles = await apiFetch("/api/admin/scan-profiles");
  scanProfiles = Array.isArray(profiles) ? profiles : [];
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
      setProfileConfigForScanType(profile.scan_type, profile.config || {});
      setProfileEditState(true, profile);
      activateAdminPane("scan-profile");
      logActivity(`Editing profile ${profile.name}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  profilesPanel.querySelectorAll("button[data-run-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.runId;
      const originalLabel = button.textContent;
      button.disabled = true;
      button.textContent = "Running...";
      logActivity(`Manual run requested for profile ${id}.`);
      try {
        const run = await apiFetch(`/api/admin/scan-profiles/${id}/run`, {
          method: "POST",
        });
        const status = run?.status || "queued";
        logActivity(`Manual run accepted for profile ${id}. Status: ${status}`);
      } catch (error) {
        logActivity(`Manual run failed for profile ${id}: ${String(error)}`);
      } finally {
        await refreshRuns().catch((refreshError) => logActivity(`Failed to refresh runs: ${String(refreshError)}`));
        await refreshInventory().catch((refreshError) => logActivity(`Failed to refresh inventory: ${String(refreshError)}`));
        window.setTimeout(() => {
          refreshRuns().catch((refreshError) => logActivity(`Failed to refresh runs: ${String(refreshError)}`));
        }, 1500);
        button.disabled = false;
        button.textContent = originalLabel || "Run Now";
      }
    });
  });

  profilesPanel.querySelectorAll("button[data-delete-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = Number(button.dataset.deleteId);
      const profile = profiles.find((candidate) => candidate.id === id);
      if (!profile) {
        return;
      }

      if (!window.confirm(`Delete profile '${profile.name}'? This removes its run history and related inventory rows.`)) {
        return;
      }

      try {
        await apiFetch(`/api/admin/scan-profiles/${id}`, {
          method: "DELETE",
        });

        if (profileEditId === id) {
          resetProfileForm();
        }

        await refreshProfiles();
        await refreshRuns();
        await refreshInventoryFilterOptions();
        await refreshInventory();
        logActivity(`Profile deleted: ${profile.name}`);
      } catch (error) {
        logActivity(`Failed to delete profile: ${String(error)}`);
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

if (menuToggleBtn) {
  menuToggleBtn.addEventListener("click", () => {
    const isHidden = menuDropdown.classList.contains("hidden");
    menuDropdown.classList.toggle("hidden", !isHidden);
    menuToggleBtn.setAttribute("aria-expanded", String(isHidden));
  });
}

document.addEventListener("click", (event) => {
  if (!menuDropdown || !menuToggleBtn) {
    return;
  }
  if (menuDropdown.classList.contains("hidden")) {
    return;
  }

  const target = event.target;
  if (menuDropdown.contains(target) || menuToggleBtn.contains(target)) {
    return;
  }
  menuDropdown.classList.add("hidden");
});

document.querySelectorAll(".menu-item[data-tab]").forEach((item) => {
  item.addEventListener("click", () => {
    const tabName = item.dataset.tab;
    if (item.classList.contains("admin-only") && currentUser?.role !== "admin") {
      return;
    }
    activateTab(tabName);
  });
});

adminBladeItems.forEach((button) => {
  button.addEventListener("click", () => {
    const paneName = button.dataset.adminPane;
    if (!paneName) {
      return;
    }
    activateAdminPane(paneName);
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
  const provider = String(inventoryProviderFilter?.value || "").trim();
  const search = String(inventoryFilterForm.elements.search?.value || "").trim();

  try {
    await refreshInventory(provider, search);
    logActivity("Inventory refreshed with filters");
  } catch (error) {
    logActivity(String(error));
  }
});

if (inventoryProviderFilter) {
  inventoryProviderFilter.addEventListener("change", () => {
    syncInventoryItemTypeState(String(inventoryProviderFilter.value || ""));
    renderInventoryItemTypeToggles();
  });
}

if (inventoryViewMode) {
  inventoryViewMode.addEventListener("change", () => {
    renderInventoryResults(
      filteredInventoryRows(inventoryLatestItems),
      inventoryLatestItems.length ? "No rows match selected filters." : "No inventory items found.",
    );
  });
}

if (inventoryItemTypeMenuBtn && inventoryItemTypeMenu) {
  inventoryItemTypeMenuBtn.addEventListener("click", () => {
    const shouldShow = inventoryItemTypeMenu.classList.contains("hidden");
    inventoryItemTypeMenu.classList.toggle("hidden", !shouldShow);
    if (shouldShow && inventoryAttributeFilterMenu) {
      inventoryAttributeFilterMenu.classList.add("hidden");
    }
  });
}

if (selectAllInventoryItemTypesBtn) {
  selectAllInventoryItemTypesBtn.addEventListener("click", () => {
    setAllInventoryItemTypeToggles(true);
    logActivity("Item type filters set: all visible");
  });
}

if (clearAllInventoryItemTypesBtn) {
  clearAllInventoryItemTypesBtn.addEventListener("click", () => {
    setAllInventoryItemTypeToggles(false);
    logActivity("Item type filters set: all hidden");
  });
}

if (inventoryAttributeFilterMenuBtn && inventoryAttributeFilterMenu) {
  inventoryAttributeFilterMenuBtn.addEventListener("click", () => {
    const shouldShow = inventoryAttributeFilterMenu.classList.contains("hidden");
    inventoryAttributeFilterMenu.classList.toggle("hidden", !shouldShow);
    if (shouldShow && inventoryItemTypeMenu) {
      inventoryItemTypeMenu.classList.add("hidden");
    }
  });
}

if (selectAllInventoryAttributesBtn) {
  selectAllInventoryAttributesBtn.addEventListener("click", () => {
    setAllInventoryAttributeToggles(true);
    logActivity("Attribute filters set: all visible");
  });
}

if (clearAllInventoryAttributesBtn) {
  clearAllInventoryAttributesBtn.addEventListener("click", () => {
    setAllInventoryAttributeToggles(false);
    logActivity("Attribute filters set: all hidden");
  });
}

document.addEventListener("click", (event) => {
  if (!inventoryItemTypeMenuBtn || !inventoryItemTypeMenu || !inventoryAttributeFilterMenuBtn || !inventoryAttributeFilterMenu) {
    return;
  }

  const target = event.target;
  const insideItemType = inventoryItemTypeMenuBtn.contains(target) || inventoryItemTypeMenu.contains(target);
  const insideAttribute = inventoryAttributeFilterMenuBtn.contains(target) || inventoryAttributeFilterMenu.contains(target);

  if (insideItemType || insideAttribute) {
    return;
  }

  inventoryItemTypeMenu.classList.add("hidden");
  inventoryAttributeFilterMenu.classList.add("hidden");
});

refreshModelsBtn.addEventListener("click", async () => {
  try {
    await refreshModels();
    logActivity("Service model catalogue refreshed");
  } catch (error) {
    logActivity(String(error));
  }
});

if (newServiceModelBtn) {
  newServiceModelBtn.addEventListener("click", () => {
    selectedServiceModelId = null;
    renderServiceModelList();
    syncServiceModelPanels();
    logActivity("Creating a new service model");
  });
}

if (serviceModelForm) {
  serviceModelForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const fd = new FormData(serviceModelForm);
    const payload = {
      name: String(fd.get("name") || "").trim(),
      description: String(fd.get("description") || "").trim() || null,
      is_active: String(fd.get("is_active") || "true") === "true",
    };

    if (!payload.name) {
      logActivity("Service name is required");
      return;
    }

    try {
      const isEditing = Number.isInteger(selectedServiceModelId);
      const path = isEditing ? `/api/service-models/catalog/${selectedServiceModelId}` : "/api/service-models/catalog";
      const method = isEditing ? "PUT" : "POST";
      const saved = await apiFetch(path, {
        method,
        body: JSON.stringify(payload),
      });

      selectedServiceModelId = saved?.id || selectedServiceModelId;
      await refreshModels();
      logActivity(`${isEditing ? "Service updated" : "Service created"}: ${payload.name}`);
    } catch (error) {
      logActivity(`Failed to save service model: ${String(error)}`);
    }
  });
}

if (deleteServiceModelBtn) {
  deleteServiceModelBtn.addEventListener("click", async () => {
    const service = selectedServiceModel();
    if (!service) {
      logActivity("Select a service before deleting");
      return;
    }

    if (!window.confirm(`Delete service '${service.name}'?`)) {
      return;
    }

    try {
      await apiFetch(`/api/service-models/catalog/${service.id}`, {
        method: "DELETE",
      });
      selectedServiceModelId = null;
      await refreshModels();
      logActivity(`Service deleted: ${service.name}`);
    } catch (error) {
      logActivity(`Failed to delete service model: ${String(error)}`);
    }
  });
}

if (serviceResourceSearchForm) {
  serviceResourceSearchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await refreshServiceInventoryCandidates();
      logActivity("Service inventory candidates refreshed");
    } catch (error) {
      logActivity(`Failed to refresh service inventory candidates: ${String(error)}`);
    }
  });
}

if (serviceResourceSearchInput) {
  serviceResourceSearchInput.addEventListener("input", () => {
    if (serviceSearchDebounceHandle) {
      clearTimeout(serviceSearchDebounceHandle);
    }
    serviceSearchDebounceHandle = setTimeout(() => {
      refreshServiceInventoryCandidates().catch((error) => logActivity(String(error)));
    }, 220);
  });
}

if (serviceResourceProviderSelect) {
  serviceResourceProviderSelect.addEventListener("change", () => {
    refreshServiceInventoryCandidates().catch((error) => logActivity(String(error)));
  });
}

if (serviceInventoryCandidatesPanel) {
  serviceInventoryCandidatesPanel.addEventListener("change", (event) => {
    const target = event.target;
    if (target && target.matches("input[data-service-candidate-key]")) {
      updateAttachResourceButtonState();
    }
  });
}

if (attachSelectedResourcesBtn) {
  attachSelectedResourcesBtn.addEventListener("click", async () => {
    const service = selectedServiceModel();
    if (!service) {
      logActivity("Select a service before attaching resources");
      return;
    }

    const selectedKeys = Array.from(
      serviceInventoryCandidatesPanel?.querySelectorAll("input[data-service-candidate-key]:checked") || []
    )
      .map((checkbox) => decodeURIComponent(String(checkbox.dataset.serviceCandidateKey || "")))
      .filter(Boolean);

    if (!selectedKeys.length) {
      logActivity("Select at least one inventory resource to attach");
      updateAttachResourceButtonState();
      return;
    }

    try {
      const result = await apiFetch(`/api/service-models/catalog/${service.id}/resources`, {
        method: "POST",
        body: JSON.stringify({ inventory_item_keys: selectedKeys }),
      });
      await refreshModels();
      await refreshServiceInventoryCandidates();
      const missing = Array.isArray(result?.missing_keys) ? result.missing_keys.length : 0;
      logActivity(`Attached ${Number(result?.attached_count || 0)} resources${missing ? ` (${missing} missing)` : ""}`);
      updateAttachResourceButtonState();
    } catch (error) {
      logActivity(`Failed to attach resources: ${String(error)}`);
      updateAttachResourceButtonState();
    }
  });
}

if (addDependencyBtn) {
  addDependencyBtn.addEventListener("click", async () => {
    const service = selectedServiceModel();
    if (!service) {
      logActivity("Select a service before adding dependencies");
      return;
    }

    const targetServiceId = Number(dependencyTargetServiceSelect?.value || "");
    if (!Number.isInteger(targetServiceId) || targetServiceId <= 0) {
      logActivity("Select a dependency target service");
      return;
    }

    const relation = String(dependencyRelationInput?.value || "depends_on").trim() || "depends_on";

    try {
      await apiFetch(`/api/service-models/catalog/${service.id}/dependencies`, {
        method: "POST",
        body: JSON.stringify({
          depends_on_service_id: targetServiceId,
          relation,
        }),
      });
      await refreshModels();
      if (dependencyTargetServiceSelect) {
        dependencyTargetServiceSelect.value = "";
      }
      logActivity("Service dependency added");
    } catch (error) {
      logActivity(`Failed to add dependency: ${String(error)}`);
    }
  });
}

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
    setProfileConfigForScanType(String(profileScanType.value || "icmp"));
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
      renderProfileQuickSettings();
      renderSecretPreview(targetPath, reference);
      logActivity(`Secret reference inserted into config at '${targetPath}'`);
    } catch (error) {
      logActivity(String(error));
    }
  });
}

if (profileConfigInput) {
  profileConfigInput.addEventListener("blur", () => {
    renderProfileQuickSettings();
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

if (secretRefProvider) {
  secretRefProvider.addEventListener("change", () => {
    toggleSecretRefProviderPanels();
  });
}

if (openSecretRefModalBtn) {
  openSecretRefModalBtn.addEventListener("click", () => {
    setSecretRefModalState(false);
    openModal(secretRefModal);
  });
}

if (closeSecretRefModalBtn) {
  closeSecretRefModalBtn.addEventListener("click", () => {
    setSecretRefModalState(false);
    closeModal(secretRefModal);
  });
}

if (secretRefForm) {
  secretRefForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const fd = new FormData(secretRefForm);
      const payload = {
        name: String(fd.get("name") || "").trim(),
        reference: buildSecretReferenceFromCatalogForm(),
      };

      const isEditing = Number.isInteger(secretRefEditId);
      const path = isEditing ? `/api/admin/secret-references/${secretRefEditId}` : "/api/admin/secret-references";
      const method = isEditing ? "PUT" : "POST";

      await apiFetch(path, {
        method,
        body: JSON.stringify(payload),
      });
      await refreshCloudConfig();
      setSecretRefModalState(false);
      closeModal(secretRefModal);
      logActivity(`${isEditing ? "Secret reference updated" : "Secret reference created"}: ${payload.name}`);
    } catch (error) {
      logActivity(`Failed to create secret reference: ${String(error)}`);
    }
  });
}

if (openAzureTenantModalBtn) {
  openAzureTenantModalBtn.addEventListener("click", async () => {
    try {
      await refreshProfiles();
      await refreshCloudConfig();
      setAzureTenantModalState(false);
      openModal(azureTenantModal);
    } catch (error) {
      logActivity(`Unable to open Azure tenant configuration: ${String(error)}`);
    }
  });
}

if (closeAzureTenantModalBtn) {
  closeAzureTenantModalBtn.addEventListener("click", () => {
    setAzureTenantModalState(false);
    closeModal(azureTenantModal);
  });
}

if (azureClientSecretMode) {
  azureClientSecretMode.addEventListener("change", () => {
    toggleAzureSecretModePanels();
  });
}

if (azureTenantProfileMode) {
  azureTenantProfileMode.addEventListener("change", () => {
    toggleAzureTenantProfilePanels();
  });
}

if (azureTenantForm) {
  azureTenantForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const fd = new FormData(azureTenantForm);
    const secretMode = String(fd.get("client_secret_mode") || "reference");
    const profileMode = String(fd.get("profile_mode") || "create_new");
    const existingProfileId = Number(fd.get("existing_profile_id"));
    const payload = {
      name: String(fd.get("name") || "").trim(),
      tenant_id: String(fd.get("tenant_id") || "").trim(),
      client_id: String(fd.get("client_id") || "").trim(),
      subscription_ids: splitOptionalList(String(fd.get("subscription_ids") || "")),
      is_active: String(fd.get("is_active") || "true") === "true",
    };

    const isEditing = Number.isInteger(azureTenantEditId);

    if (profileMode === "use_existing") {
      if (!Number.isInteger(existingProfileId) || existingProfileId <= 0) {
        logActivity("Select a valid scanning profile.");
        return;
      }

      const existingProfile = scanProfiles.find((profile) => profile.id === existingProfileId && profile.scan_type === "azure");
      if (!existingProfile) {
        logActivity("Selected scanning profile was not found or is not an Azure profile.");
        return;
      }
    }

    if (secretMode === "reference") {
      const refId = Number(fd.get("client_secret_ref_id"));
      if (!Number.isInteger(refId) || refId <= 0) {
        logActivity("Select a valid client secret reference.");
        return;
      }
      payload.client_secret_ref_id = refId;
    } else {
      const inlineSecret = String(fd.get("client_secret") || "").trim();
      if (inlineSecret) {
        payload.client_secret = inlineSecret;
      } else if (!isEditing || azureTenantCurrentSecretSource !== "encrypted") {
        logActivity("Provide a client secret when using direct encrypted mode.");
        return;
      }
    }

    try {
      const path = isEditing ? `/api/admin/azure-tenants/${azureTenantEditId}` : "/api/admin/azure-tenants";
      const method = isEditing ? "PUT" : "POST";

      const tenantResult = await apiFetch(path, {
        method,
        body: JSON.stringify(payload),
      });

      if (profileMode === "create_new") {
        const profilePayload = {
          profile_name: String(fd.get("profile_name") || "").trim() || null,
          schedule_minutes: Number(fd.get("profile_schedule_minutes") || 60),
          max_resources_per_subscription: Number(fd.get("profile_max_resources_per_subscription") || 2000),
          is_enabled: String(fd.get("profile_is_enabled") || "true") === "true",
        };

        await apiFetch(`/api/admin/azure-tenants/${tenantResult.id}/create-profile`, {
          method: "POST",
          body: JSON.stringify(profilePayload),
        });
      } else if (profileMode === "use_existing") {
        const existingProfile = scanProfiles.find((profile) => profile.id === existingProfileId && profile.scan_type === "azure");
        if (!existingProfile) {
          throw new Error("Selected scanning profile was not found or is not an Azure profile");
        }

        const updatedConfig = {
          ...(existingProfile.config || {}),
          tenant_config_id: tenantResult.id,
        };

        await apiFetch(`/api/admin/scan-profiles/${existingProfileId}`, {
          method: "PUT",
          body: JSON.stringify({
            config: updatedConfig,
          }),
        });
      }

      await refreshProfiles();
      await refreshCloudConfig();
      setAzureTenantModalState(false);
      closeModal(azureTenantModal);
      const profileMessage = profileMode === "use_existing" ? "Existing profile linked" : "New profile created";
      logActivity(`${isEditing ? "Azure tenant updated" : "Azure tenant created"}: ${payload.name}. ${profileMessage}.`);
    } catch (error) {
      logActivity(`Failed to save Azure tenant: ${String(error)}`);
    }
  });
}

if (openAwsAccountModalBtn) {
  openAwsAccountModalBtn.addEventListener("click", async () => {
    try {
      await refreshCloudConfig();
      setAwsAccountModalState(false);
      openModal(awsAccountModal);
      if (!secretReferences.length) {
        logActivity("No secret references found. You can still configure AWS using Assume Role or direct encrypted credentials.");
      }
    } catch (error) {
      logActivity(`Unable to open AWS configuration: ${String(error)}`);
    }
  });
}

if (closeAwsAccountModalBtn) {
  closeAwsAccountModalBtn.addEventListener("click", () => {
    setAwsAccountModalState(false);
    closeModal(awsAccountModal);
  });
}

if (awsAccountForm) {
  awsAccountForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const fd = new FormData(awsAccountForm);
    const authMode = String(fd.get("auth_mode") || "access_key");
    const credentialSource = String(fd.get("credential_source") || "reference");
    const sessionTokenValue = String(fd.get("session_token_ref_id") || "").trim();
    const sessionTokenRefId = sessionTokenValue ? Number(sessionTokenValue) : null;
    const isEditing = Number.isInteger(awsAccountEditId);
    const currentAccount = isEditing
      ? awsAccounts.find((item) => item.id === awsAccountEditId) || null
      : null;
    const currentCredentialSource = String(currentAccount?.credential_source || "reference");

    const payload = {
      name: String(fd.get("name") || "").trim(),
      auth_mode: authMode,
      regions: splitOptionalList(String(fd.get("regions") || "")),
      is_active: String(fd.get("is_active") || "true") === "true",
    };

    if (!payload.name) {
      logActivity("Provide an AWS account name.");
      return;
    }

    if (authMode === "access_key") {
      payload.credential_source = credentialSource;

      if (credentialSource === "reference") {
        const accessValue = String(fd.get("access_key_ref_id") || "").trim();
        const secretValue = String(fd.get("secret_access_key_ref_id") || "").trim();
        const accessRefId = accessValue ? Number(accessValue) : null;
        const secretRefId = secretValue ? Number(secretValue) : null;

        if (!Number.isInteger(accessRefId) || accessRefId <= 0) {
          logActivity("Select an access key reference.");
          return;
        }
        if (!Number.isInteger(secretRefId) || secretRefId <= 0) {
          logActivity("Select a secret access key reference.");
          return;
        }

        payload.access_key_ref_id = accessRefId;
        payload.secret_access_key_ref_id = secretRefId;
      } else {
        const rawAccessKeyId = String(fd.get("access_key_id") || "").trim();
        const rawSecretAccessKey = String(fd.get("secret_access_key") || "").trim();
        const requiresInlineValues = !isEditing || currentCredentialSource !== "inline_encrypted";

        if (requiresInlineValues && !rawAccessKeyId) {
          logActivity("Provide an access key ID for direct encrypted credential mode.");
          return;
        }
        if (requiresInlineValues && !rawSecretAccessKey) {
          logActivity("Provide a secret access key for direct encrypted credential mode.");
          return;
        }

        if (rawAccessKeyId) {
          payload.access_key_id = rawAccessKeyId;
        }
        if (rawSecretAccessKey) {
          payload.secret_access_key = rawSecretAccessKey;
        }
      }

      payload.session_token_ref_id = Number.isInteger(sessionTokenRefId) && sessionTokenRefId > 0
        ? sessionTokenRefId
        : null;
    } else {
      const roleArn = String(fd.get("role_arn") || "").trim();
      if (!roleArn) {
        logActivity("Provide a role ARN for assume role mode.");
        return;
      }

      payload.role_arn = roleArn;
      payload.external_id = String(fd.get("external_id") || "").trim() || null;
      payload.session_token_ref_id = null;
    }

    try {
      const path = isEditing ? `/api/admin/aws-accounts/${awsAccountEditId}` : "/api/admin/aws-accounts";
      const method = isEditing ? "PUT" : "POST";
      await apiFetch(path, {
        method,
        body: JSON.stringify(payload),
      });
      await refreshCloudConfig();
      setAwsAccountModalState(false);
      closeModal(awsAccountModal);
      logActivity(`${isEditing ? "AWS account updated" : "AWS account created"}: ${payload.name}`);
    } catch (error) {
      logActivity(`Failed to save AWS account: ${String(error)}`);
    }
  });
}

if (awsAuthMode) {
  awsAuthMode.addEventListener("change", () => {
    toggleAwsAuthModePanels();
  });
}

if (awsCredentialSource) {
  awsCredentialSource.addEventListener("change", () => {
    toggleAwsCredentialSourcePanels();
  });
}

if (openGcpAccountModalBtn) {
  openGcpAccountModalBtn.addEventListener("click", async () => {
    try {
      await refreshCloudConfig();
      setGcpAccountModalState(false);
      openModal(gcpAccountModal);
      if (!secretReferences.length) {
        logActivity("No secret references found. You can still configure GCP using direct encrypted service account JSON.");
      }
    } catch (error) {
      logActivity(`Unable to open GCP configuration: ${String(error)}`);
    }
  });
}

if (closeGcpAccountModalBtn) {
  closeGcpAccountModalBtn.addEventListener("click", () => {
    setGcpAccountModalState(false);
    closeModal(gcpAccountModal);
  });
}

if (gcpServiceAccountMode) {
  gcpServiceAccountMode.addEventListener("change", () => {
    toggleGcpServiceAccountPanels();
  });
}

if (gcpAccountForm) {
  gcpAccountForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const fd = new FormData(gcpAccountForm);
    const serviceAccountMode = String(fd.get("service_account_mode") || "reference");
    const isEditing = Number.isInteger(gcpAccountEditId);

    const payload = {
      name: String(fd.get("name") || "").trim(),
      project_ids: splitOptionalList(String(fd.get("project_ids") || "")),
      is_active: String(fd.get("is_active") || "true") === "true",
    };

    if (!payload.name) {
      logActivity("Provide a GCP account name.");
      return;
    }

    if (serviceAccountMode === "reference") {
      const refId = Number(fd.get("service_account_ref_id"));
      if (!Number.isInteger(refId) || refId <= 0) {
        logActivity("Select a valid service account reference.");
        return;
      }
      payload.service_account_ref_id = refId;
    } else {
      const inlineJson = String(fd.get("service_account_json") || "").trim();
      if (inlineJson) {
        payload.service_account_json = inlineJson;
      } else if (!isEditing || gcpAccountCurrentSecretSource !== "encrypted") {
        logActivity("Provide service account JSON when using direct encrypted mode.");
        return;
      }
    }

    try {
      const path = isEditing ? `/api/admin/gcp-accounts/${gcpAccountEditId}` : "/api/admin/gcp-accounts";
      const method = isEditing ? "PUT" : "POST";

      await apiFetch(path, {
        method,
        body: JSON.stringify(payload),
      });

      await refreshCloudConfig();
      setGcpAccountModalState(false);
      closeModal(gcpAccountModal);
      logActivity(`${isEditing ? "GCP account updated" : "GCP account created"}: ${payload.name}`);
    } catch (error) {
      logActivity(`Failed to save GCP account: ${String(error)}`);
    }
  });
}

if (refreshCloudConfigBtn) {
  refreshCloudConfigBtn.addEventListener("click", async () => {
    try {
      await refreshCloudConfig();
      logActivity("Cloud account configuration refreshed");
    } catch (error) {
      logActivity(String(error));
    }
  });
}

if (ssoClientSecretMode) {
  ssoClientSecretMode.addEventListener("change", () => {
    toggleSsoSecretModePanels();
  });
}

if (ssoConfigForm) {
  ssoConfigForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const fd = new FormData(ssoConfigForm);
    const secretMode = String(fd.get("client_secret_mode") || "reference");

    const payload = {
      is_enabled: String(fd.get("is_enabled") || "false") === "true",
      tenant_id: String(fd.get("tenant_id") || "").trim() || null,
      client_id: String(fd.get("client_id") || "").trim() || null,
      redirect_uri: String(fd.get("redirect_uri") || "").trim() || null,
      default_role: String(fd.get("default_role") || "user"),
      role_claim_key: String(fd.get("role_claim_key") || "groups").trim() || "groups",
      admin_group_ids: splitOptionalList(String(fd.get("admin_group_ids") || "")),
      user_group_ids: splitOptionalList(String(fd.get("user_group_ids") || "")),
      admin_emails: splitOptionalLowerList(String(fd.get("admin_emails") || "")),
    };

    if (secretMode === "reference") {
      const secretRefRaw = String(fd.get("client_secret_ref_id") || "").trim();
      const secretRefId = secretRefRaw ? Number(secretRefRaw) : null;
      if (secretRefId && Number.isInteger(secretRefId) && secretRefId > 0) {
        payload.client_secret_ref_id = secretRefId;
      } else {
        payload.client_secret_ref_id = null;
      }
    } else {
      const inlineSecret = String(fd.get("client_secret") || "").trim();
      if (inlineSecret) {
        payload.client_secret = inlineSecret;
      } else if (payload.is_enabled && ssoCurrentSecretSource !== "encrypted") {
        logActivity("Provide a client secret when using direct encrypted mode.");
        return;
      }
    }

    try {
      const updated = await apiFetch("/api/admin/sso-config", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setSsoConfigForm(updated);
      logActivity("SSO configuration updated");
    } catch (error) {
      logActivity(`Failed to save SSO configuration: ${String(error)}`);
    }
  });
}

if (refreshSsoConfigBtn) {
  refreshSsoConfigBtn.addEventListener("click", async () => {
    try {
      await refreshSsoConfig();
      logActivity("SSO configuration refreshed");
    } catch (error) {
      logActivity(`Failed to refresh SSO configuration: ${String(error)}`);
    }
  });
}

if (userForm) {
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
      userForm.reset();
    } catch (error) {
      logActivity(String(error));
    }
  });
}

if (refreshUsersBtn) {
  refreshUsersBtn.addEventListener("click", async () => {
    try {
      await refreshUsers();
      logActivity("User list refreshed");
    } catch (error) {
      logActivity(String(error));
    }
  });
}

refreshProfilesBtn.addEventListener("click", async () => {
  try {
    await refreshProfiles();
    logActivity("Profiles refreshed");
  } catch (error) {
    logActivity(String(error));
  }
});

[azureTenantModal, awsAccountModal, gcpAccountModal, secretRefModal].forEach((modal) => {
  if (!modal) {
    return;
  }
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      if (modal === azureTenantModal) {
        setAzureTenantModalState(false);
      }
      if (modal === awsAccountModal) {
        setAwsAccountModalState(false);
      }
      if (modal === secretRefModal) {
        setSecretRefModalState(false);
      }
      if (modal === gcpAccountModal) {
        setGcpAccountModalState(false);
      }
      closeModal(modal);
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (secretRefModal && !secretRefModal.classList.contains("hidden")) {
    setSecretRefModalState(false);
    closeModal(secretRefModal);
    return;
  }
  if (azureTenantModal && !azureTenantModal.classList.contains("hidden")) {
    setAzureTenantModalState(false);
    closeModal(azureTenantModal);
    return;
  }
  if (awsAccountModal && !awsAccountModal.classList.contains("hidden")) {
    setAwsAccountModalState(false);
    closeModal(awsAccountModal);
    return;
  }
  if (gcpAccountModal && !gcpAccountModal.classList.contains("hidden")) {
    setGcpAccountModalState(false);
    closeModal(gcpAccountModal);
  }
});

setProfileConfigForScanType(String(profileScanType?.value || "icmp"));
toggleProviderPanels();
toggleSecretRefProviderPanels();
toggleAzureSecretModePanels();
toggleAwsAuthModePanels();
toggleGcpServiceAccountPanels();
toggleSsoSecretModePanels();
setProfileEditState(false);
updateInventoryItemTypeButtonText();
renderInventoryItemTypeToggles();
updateInventoryAttributeFilterButtonText();
renderInventoryAttributeToggles();
activateAdminPane(activeAdminPane);

if (inventoryItemTypeMenu) {
  inventoryItemTypeMenu.classList.add("hidden");
}

if (inventoryAttributeFilterMenu) {
  inventoryAttributeFilterMenu.classList.add("hidden");
}

initializeSession();
