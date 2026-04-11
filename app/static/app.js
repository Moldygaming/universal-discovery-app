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
const inventoryTableBody = document.getElementById("inventoryTableBody");
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
const azureTenantsPanel = document.getElementById("azureTenantsPanel");
const awsAccountsPanel = document.getElementById("awsAccountsPanel");
const secretRefsPanel = document.getElementById("secretRefsPanel");
const refreshCloudConfigBtn = document.getElementById("refreshCloudConfigBtn");
const openAzureTenantModalBtn = document.getElementById("openAzureTenantModalBtn");
const openAwsAccountModalBtn = document.getElementById("openAwsAccountModalBtn");
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
const awsAccountModal = document.getElementById("awsAccountModal");
const awsAccountModalTitle = document.getElementById("awsAccountModalTitle");
const saveAwsAccountBtn = document.getElementById("saveAwsAccountBtn");
const closeAwsAccountModalBtn = document.getElementById("closeAwsAccountModalBtn");
const awsAccountForm = document.getElementById("awsAccountForm");
const awsAccessKeyRefSelect = document.getElementById("awsAccessKeyRefSelect");
const awsSecretAccessKeyRefSelect = document.getElementById("awsSecretAccessKeyRefSelect");
const awsSessionTokenRefSelect = document.getElementById("awsSessionTokenRefSelect");
const azureProfileWizardModal = document.getElementById("azureProfileWizardModal");
const closeAzureProfileWizardModalBtn = document.getElementById("closeAzureProfileWizardModalBtn");
const azureProfileWizardForm = document.getElementById("azureProfileWizardForm");
const wizardTenantLabel = document.getElementById("wizardTenantLabel");
const wizardProfileName = document.getElementById("wizardProfileName");
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
};

let accessToken = null;
let currentUser = null;
let profileEditId = null;
let secretReferences = [];
let azureTenants = [];
let awsAccounts = [];
let secretRefEditId = null;
let azureTenantEditId = null;
let awsAccountEditId = null;
let wizardTenantId = null;
let azureTenantCurrentSecretSource = null;

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
  document.querySelectorAll(".menu-item[data-tab]").forEach((item) => {
    item.classList.toggle("active", item.dataset.tab === tabName);
  });

  document.querySelectorAll(".tab-view").forEach((view) => {
    view.classList.toggle("hidden", view.id !== `view-${tabName}`);
  });

  if (menuDropdown && !menuDropdown.classList.contains("hidden")) {
    menuDropdown.classList.add("hidden");
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
  await refreshCloudConfig();
}

function splitOptionalList(value) {
  const parsed = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return parsed.length ? parsed : null;
}

function boolToSelectValue(value) {
  return value ? "true" : "false";
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
  if (azureClientSecretMode) {
    azureClientSecretMode.value = "reference";
  }
  if (azureInlineClientSecretInput) {
    azureInlineClientSecretInput.placeholder = "Enter Azure app client secret";
  }
  toggleAzureSecretModePanels();

  if (!editing || !tenant || !azureTenantForm) {
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

  if (!editing || !account || !awsAccountForm) {
    return;
  }

  awsAccountForm.elements.name.value = account.name;
  awsAccountForm.elements.access_key_ref_id.value = String(account.access_key_ref_id);
  awsAccountForm.elements.secret_access_key_ref_id.value = String(account.secret_access_key_ref_id);
  awsAccountForm.elements.session_token_ref_id.value = account.session_token_ref_id
    ? String(account.session_token_ref_id)
    : "";
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

function syncAwsSecretRefDropdowns() {
  populateSecretRefSelect(awsAccessKeyRefSelect);
  populateSecretRefSelect(awsSecretAccessKeyRefSelect);
  populateSecretRefSelect(awsSessionTokenRefSelect, { allowEmpty: true, emptyLabel: "-- no session token --" });
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
      (tenant) => `
      <div class="list-item">
        <h4>${tenant.name}</h4>
        <div>Tenant ID: ${tenant.tenant_id}</div>
        <div>Client ID: ${tenant.client_id}</div>
        <div>Secret: ${tenant.client_secret_ref_name || "unknown"}</div>
        <div>Secret Source: ${tenant.client_secret_source}</div>
        <div>Active: ${tenant.is_active}</div>
        <div class="mini-actions">
          <button data-use-azure-tenant="${tenant.id}">Use In Profile</button>
          <button data-wizard-azure-tenant="${tenant.id}">Profile Wizard</button>
          <button data-edit-azure-tenant="${tenant.id}">Edit</button>
          <button data-delete-azure-tenant="${tenant.id}" class="secondary">Delete</button>
        </div>
      </div>
    `,
    )
    .join("");

  azureTenantsPanel.querySelectorAll("button[data-use-azure-tenant]").forEach((button) => {
    button.addEventListener("click", () => {
      const tenantId = Number(button.dataset.useAzureTenant);
      if (profileScanType) {
        profileScanType.value = "azure";
      }
      refreshTargetFieldOptions();

      profileConfigInput.value = JSON.stringify(
        {
          tenant_config_id: tenantId,
          max_resources_per_subscription: 2000,
        },
        null,
        2,
      );

      activateTab("admin");
      logActivity(`Inserted Azure tenant config ${tenantId} into profile config.`);
    });
  });

  azureTenantsPanel.querySelectorAll("button[data-wizard-azure-tenant]").forEach((button) => {
    button.addEventListener("click", () => {
      const tenantId = Number(button.dataset.wizardAzureTenant);
      const tenant = azureTenants.find((item) => item.id === tenantId);
      if (!tenant) {
        return;
      }
      wizardTenantId = tenant.id;
      if (wizardTenantLabel) {
        wizardTenantLabel.textContent = `Selected tenant: ${tenant.name}`;
      }
      if (wizardProfileName) {
        wizardProfileName.value = `azure-${tenant.name}-profile`;
      }
      azureProfileWizardForm?.reset();
      if (wizardProfileName) {
        wizardProfileName.value = `azure-${tenant.name}-profile`;
      }
      openModal(azureProfileWizardModal);
    });
  });

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
      (account) => `
      <div class="list-item">
        <h4>${account.name}</h4>
        <div>Access Ref: ${account.access_key_ref_name}</div>
        <div>Secret Ref: ${account.secret_access_key_ref_name}</div>
        <div>Session Ref: ${account.session_token_ref_name || "none"}</div>
        <div>Regions: ${(account.regions || []).join(", ") || "all"}</div>
        <div>Active: ${account.is_active}</div>
        <div class="mini-actions">
          <button data-use-aws-account="${account.id}">Use In Profile</button>
          <button data-edit-aws-account="${account.id}">Edit</button>
          <button data-delete-aws-account="${account.id}" class="secondary">Delete</button>
        </div>
      </div>
    `,
    )
    .join("");

  awsAccountsPanel.querySelectorAll("button[data-use-aws-account]").forEach((button) => {
    button.addEventListener("click", () => {
      const accountId = Number(button.dataset.useAwsAccount);
      if (profileScanType) {
        profileScanType.value = "aws";
      }
      refreshTargetFieldOptions();

      profileConfigInput.value = JSON.stringify(
        {
          aws_account_id: accountId,
          max_resources_per_region: 2000,
        },
        null,
        2,
      );

      activateTab("admin");
      logActivity(`Inserted AWS account config ${accountId} into profile config.`);
    });
  });

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

async function refreshCloudConfig() {
  if (currentUser?.role !== "admin") {
    return;
  }

  const [refs, tenants, aws] = await Promise.all([
    apiFetch("/api/admin/secret-references"),
    apiFetch("/api/admin/azure-tenants"),
    apiFetch("/api/admin/aws-accounts"),
  ]);

  secretReferences = refs;
  azureTenants = tenants;
  awsAccounts = Array.isArray(aws) ? aws : [];

  renderSecretReferencesPanel();
  syncAzureSecretRefDropdown();
  syncAwsSecretRefDropdowns();
  renderAzureTenantsPanel();
  renderAwsAccountsPanel();
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

  if (!inventoryTableBody) {
    inventoryPanel.textContent = JSON.stringify(items, null, 2);
    return;
  }

  if (!Array.isArray(items) || !items.length) {
    inventoryTableBody.innerHTML = '<tr><td colspan="7" class="empty-cell">No inventory items found.</td></tr>';
    return;
  }

  const rows = items
    .map((item) => {
      const discovered = item.discovered_at ? new Date(item.discovered_at).toLocaleString() : "";
      return `
        <tr>
          <td>${item.provider || ""}</td>
          <td>${item.item_type || ""}</td>
          <td>${item.name || ""}</td>
          <td>${item.region || ""}</td>
          <td title="${item.item_key || ""}">${item.item_key || ""}</td>
          <td title="${item.parent_key || ""}">${item.parent_key || ""}</td>
          <td>${discovered}</td>
        </tr>
      `;
    })
    .join("");

  inventoryTableBody.innerHTML = rows;
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
    await refreshCloudConfig();
    setAzureTenantModalState(false);
    openModal(azureTenantModal);
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

if (azureTenantForm) {
  azureTenantForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const fd = new FormData(azureTenantForm);
    const secretMode = String(fd.get("client_secret_mode") || "reference");
    const payload = {
      name: String(fd.get("name") || "").trim(),
      tenant_id: String(fd.get("tenant_id") || "").trim(),
      client_id: String(fd.get("client_id") || "").trim(),
      subscription_ids: splitOptionalList(String(fd.get("subscription_ids") || "")),
      is_active: String(fd.get("is_active") || "true") === "true",
    };

    const isEditing = Number.isInteger(azureTenantEditId);
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

      await apiFetch(path, {
        method,
        body: JSON.stringify(payload),
      });
      await refreshCloudConfig();
      setAzureTenantModalState(false);
      closeModal(azureTenantModal);
      logActivity(`${isEditing ? "Azure tenant updated" : "Azure tenant created"}: ${payload.name}`);
    } catch (error) {
      logActivity(`Failed to save Azure tenant: ${String(error)}`);
    }
  });
}

if (openAwsAccountModalBtn) {
  openAwsAccountModalBtn.addEventListener("click", async () => {
    await refreshCloudConfig();
    if (!secretReferences.length) {
      logActivity("Create a secret reference first using 'Add Secret Reference', then configure AWS account.");
      return;
    }
    setAwsAccountModalState(false);
    openModal(awsAccountModal);
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
    const payload = {
      name: String(fd.get("name") || "").trim(),
      access_key_ref_id: Number(fd.get("access_key_ref_id")),
      secret_access_key_ref_id: Number(fd.get("secret_access_key_ref_id")),
      session_token_ref_id: fd.get("session_token_ref_id")
        ? Number(fd.get("session_token_ref_id"))
        : null,
      regions: splitOptionalList(String(fd.get("regions") || "")),
      is_active: String(fd.get("is_active") || "true") === "true",
    };

    try {
      const isEditing = Number.isInteger(awsAccountEditId);
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

if (closeAzureProfileWizardModalBtn) {
  closeAzureProfileWizardModalBtn.addEventListener("click", () => {
    wizardTenantId = null;
    closeModal(azureProfileWizardModal);
  });
}

if (azureProfileWizardForm) {
  azureProfileWizardForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!wizardTenantId) {
      logActivity("No Azure tenant selected for wizard.");
      return;
    }

    const fd = new FormData(azureProfileWizardForm);
    const payload = {
      profile_name: String(fd.get("profile_name") || "").trim() || null,
      schedule_minutes: Number(fd.get("schedule_minutes") || 60),
      max_resources_per_subscription: Number(fd.get("max_resources_per_subscription") || 2000),
      is_enabled: String(fd.get("is_enabled") || "true") === "true",
    };

    try {
      const profile = await apiFetch(`/api/admin/azure-tenants/${wizardTenantId}/create-profile`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      closeModal(azureProfileWizardModal);
      wizardTenantId = null;
      await refreshProfiles();
      activateTab("admin");
      logActivity(`Azure profile created from tenant: ${profile.name}`);
    } catch (error) {
      logActivity(`Failed to create profile from tenant: ${String(error)}`);
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

[azureTenantModal, awsAccountModal, azureProfileWizardModal, secretRefModal].forEach((modal) => {
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
      if (modal === azureProfileWizardModal) {
        wizardTenantId = null;
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
  if (azureProfileWizardModal && !azureProfileWizardModal.classList.contains("hidden")) {
    wizardTenantId = null;
    closeModal(azureProfileWizardModal);
  }
});

refreshTargetFieldOptions();
toggleProviderPanels();
toggleSecretRefProviderPanels();
toggleAzureSecretModePanels();
setProfileEditState(false);

initializeSession();
