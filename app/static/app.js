const state = {
  session: null,
  historyItems: [],
  activePage: "dashboard",
  theme: "light",
  language: "en",
  currentUser: null,
  webhookSettings: null,
  googleLoginSettings: null,
  selectedPageId: null,
  compareMode: "auto",
  poller: null,
  isBusy: false,
  modalPageId: null,
  modalKind: "processed",
  modalExternal: null,
  jsonModalPageId: null,
  jsonModalExternal: null,
  modalZoom: 1,
  modalBaseWidth: 0,
  modalBaseHeight: 0,
  modalIsDragging: false,
  modalDragStartX: 0,
  modalDragStartY: 0,
  modalDragScrollLeft: 0,
  modalDragScrollTop: 0,
  googleGisReady: false,
  googleGisChecked: false,
};

const ACTIVE_SESSION_STORAGE_KEY = "webdocto_active_session_id";
const ACTIVE_PAGE_STORAGE_KEY = "webdocto_active_page";
const ACTIVE_THEME_STORAGE_KEY = "webdocto_theme";
const ACTIVE_LANGUAGE_STORAGE_KEY = "webdocto_language";
const GOOGLE_LOGIN_ENABLED_STORAGE_KEY = "googleLoginEnabled";
const GOOGLE_CLIENT_ID_STORAGE_KEY = "googleClientId";
const GOOGLE_CLIENT_SECRET_STORAGE_KEY = "googleClientSecret";
const GOOGLE_JAVASCRIPT_ORIGIN_STORAGE_KEY = "googleJavaScriptOrigin";
const GOOGLE_REDIRECT_URI_STORAGE_KEY = "googleRedirectUri";
const GOOGLE_LOGIN_URL_STORAGE_KEY = "googleLoginUrl";
const GOOGLE_LOGIN_SUCCESS_URL_STORAGE_KEY = "googleLoginSuccessUrl";
const ADMIN_EMAIL_LIST_STORAGE_KEY = "adminEmailList";
const LAST_GOOGLE_LOGIN_EMAIL_STORAGE_KEY = "webdocto_last_google_email";
const LAST_GOOGLE_LOGIN_NAME_STORAGE_KEY = "webdocto_last_google_name";
const CURRENT_USER_NAME_STORAGE_KEY = "webdocto_current_user_name";
const CURRENT_USER_EMAIL_STORAGE_KEY = "webdocto_current_user_email";
const CURRENT_USER_ROLE_STORAGE_KEY = "webdocto_current_user_role";
const ACTIVE_WEBHOOK_URL_STORAGE_KEY = "webdocto_webhook_url";
const ACTIVE_WEBHOOK_METHOD_STORAGE_KEY = "webdocto_webhook_method";
const ACTIVE_WEBHOOK_BODY_STORAGE_KEY = "webdocto_webhook_body";

const els = {
  input: document.getElementById("pdf-input"),
  dropzone: document.getElementById("dropzone"),
  processBtn: document.getElementById("process-btn"),
  cancelBtn: document.getElementById("cancel-btn"),
  uploadHint: document.getElementById("upload-hint"),
  queueSummary: document.getElementById("queue-summary"),
  fileList: document.getElementById("file-list"),
  pageGrid: document.getElementById("page-grid"),
  compareView: document.getElementById("compare-view"),
  logList: document.getElementById("log-list"),
  metricPages: document.getElementById("metric-pages"),
  metricCompleted: document.getElementById("metric-completed"),
  metricStatusCard: document.getElementById("metric-status-card"),
  metricStatus: document.getElementById("metric-status"),
  metricStatusDetail: document.getElementById("metric-status-detail"),
  metricStatusIcon: document.getElementById("metric-status-icon"),
  imageModal: document.getElementById("image-modal"),
  imageModalBackdrop: document.getElementById("image-modal-backdrop"),
  imageModalBody: document.getElementById("image-modal-body"),
  imageModalStage: document.getElementById("image-modal-stage"),
  imageModalTitle: document.getElementById("image-modal-title"),
  imageModalKicker: document.getElementById("image-modal-kicker"),
  imageModalImg: document.getElementById("image-modal-img"),
  imageModalClose: document.getElementById("image-modal-close"),
  imageModalZoomOut: document.getElementById("image-modal-zoom-out"),
  imageModalZoomDisplay: document.getElementById("image-modal-zoom-display"),
  imageModalZoomReset: document.getElementById("image-modal-zoom-reset"),
  imageModalZoomIn: document.getElementById("image-modal-zoom-in"),
  jsonModal: document.getElementById("json-modal"),
  jsonModalBackdrop: document.getElementById("json-modal-backdrop"),
  jsonModalTitle: document.getElementById("json-modal-title"),
  jsonModalKicker: document.getElementById("json-modal-kicker"),
  jsonModalTable: document.getElementById("json-modal-table"),
  jsonModalRaw: document.getElementById("json-modal-raw"),
  jsonModalDownload: document.getElementById("json-modal-download"),
  jsonModalClose: document.getElementById("json-modal-close"),
  historyList: document.getElementById("history-list"),
  historyClearBtn: document.getElementById("history-clear-btn"),
  loginPage: document.getElementById("login-page"),
  loginEmail: document.getElementById("login-email"),
  loginEmailModern: document.getElementById("login-email-modern"),
  loginDemoBtn: document.getElementById("login-demo-btn"),
  loginDemoBtnModern: document.getElementById("login-demo-btn-modern"),
  loginGoogleBtn: document.getElementById("login-google-btn"),
  loginGoogleBtnModern: document.getElementById("login-google-btn-modern"),
  loginPrimaryBtn: document.getElementById("login-primary-btn"),
  loginGoogleNote: document.getElementById("login-google-note"),
  loginGoogleNoteModern: document.getElementById("login-google-note-modern"),
  loginCurrentName: document.getElementById("login-current-name"),
  loginCurrentNameModern: document.getElementById("login-current-name-modern"),
  loginCurrentEmail: document.getElementById("login-current-email"),
  loginCurrentEmailModern: document.getElementById("login-current-email-modern"),
  loginCurrentRole: document.getElementById("login-current-role"),
  loginCurrentRoleModern: document.getElementById("login-current-role-modern"),
  loginFeedback: document.getElementById("login-feedback"),
  loginFeedbackModern: document.getElementById("login-feedback-modern"),
  sidebarUserCard: document.getElementById("sidebar-user-card"),
  sidebarUserAvatar: document.getElementById("sidebar-user-avatar"),
  sidebarUserName: document.getElementById("sidebar-user-name"),
  sidebarUserEmail: document.getElementById("sidebar-user-email"),
  sidebarUserRole: document.getElementById("sidebar-user-role"),
  profilePage: document.getElementById("profile-page"),
  profileAvatar: document.getElementById("profile-avatar"),
  profileName: document.getElementById("profile-name"),
  profileEmail: document.getElementById("profile-email"),
  profileRole: document.getElementById("profile-role"),
  profileNameDetail: document.getElementById("profile-name-detail"),
  profileEmailDetail: document.getElementById("profile-email-detail"),
  profileRoleDetail: document.getElementById("profile-role-detail"),
  profileStatusDetail: document.getElementById("profile-status-detail"),
  profileFeedback: document.getElementById("profile-feedback"),
  profileLoginBtn: document.getElementById("profile-login-btn"),
  profileLogoutBtn: document.getElementById("profile-logout-btn"),
  dashboardPage: document.getElementById("dashboard-page"),
  historyPage: document.getElementById("history-page"),
  logsPage: document.getElementById("logs-page"),
  settingsPage: document.getElementById("settings-page"),
  settingsThemeValue: document.getElementById("settings-theme-value"),
  settingsLanguageValue: document.getElementById("settings-language-value"),
  settingsWebhookSection: document.getElementById("settings-webhook-section"),
  googleLoginSettingsCard: document.getElementById("google-login-settings-card"),
  settingsCurrentSessionCard: document.getElementById("settings-current-session-card"),
  googleLoginEnabled: document.getElementById("google-login-enabled"),
  googleClientId: document.getElementById("google-client-id"),
  googleClientSecret: document.getElementById("google-client-secret"),
  googleSecretToggle: document.getElementById("google-secret-toggle"),
  googleJavaScriptOrigin: document.getElementById("google-javascript-origin"),
  googleRedirectUri: document.getElementById("google-redirect-uri"),
  googleLoginUrl: document.getElementById("google-login-url"),
  googleLoginSuccessUrl: document.getElementById("google-login-success-url"),
  adminEmailList: document.getElementById("admin-email-list"),
  saveGoogleSettingsBtn: document.getElementById("save-google-settings-btn"),
  testGoogleLoginBtn: document.getElementById("test-google-login-btn"),
  copyRedirectUriBtn: document.getElementById("copy-redirect-uri-btn"),
  copyJavaScriptOriginBtn: document.getElementById("copy-javascript-origin-btn"),
  googleLoginStatusBox: document.getElementById("google-login-status-box"),
  googleLoginStatusTitle: document.getElementById("google-login-status-title"),
  googleLoginStatusText: document.getElementById("google-login-status-text"),
  googleSettingsFeedback: document.getElementById("google-settings-feedback"),
  settingsWebhookUrl: document.getElementById("settings-webhook-url"),
  settingsWebhookMethod: document.getElementById("settings-webhook-method"),
  settingsWebhookBody: document.getElementById("settings-webhook-body"),
};

const MIN_MODAL_ZOOM = 0.5;
const MAX_MODAL_ZOOM = 4;
const MODAL_ZOOM_STEP = 0.25;
const SUPPORTED_UPLOAD_SUFFIXES = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"];
const LOCALE_BY_LANGUAGE = {
  en: "en-US",
  th: "th-TH",
};
const DEFAULT_WEBHOOK_SETTINGS = {
  url: "https://n8n.sahapat.com:5678/webhook/WebDocToFolw",
  method: "POST",
  body: `{
  "session_id": "{{sessionId}}",
  "metadata": "{{metadata_json}}"
}`,
};
const WEBHOOK_METHOD_OPTIONS = ["POST", "PUT", "PATCH"];
const DEFAULT_GOOGLE_LOGIN_SETTINGS = {
  enabled: false,
  clientId: "",
  clientSecret: "",
  javaScriptOrigin: "",
  redirectUri: "",
  loginUrl: "",
  successUrl: "",
  adminEmailList: "",
};

const GOOGLE_GIS_WAIT_TIMEOUT_MS = 10000;
const GOOGLE_GIS_POLL_INTERVAL_MS = 125;

const STATUS_ICON_BY_STATE = {
  idle: "Loader cat.svg",
  uploaded: "Upload Files.svg",
  processing: "Sandy Loading.svg",
  completed: "Job creation success animation.svg",
  failed: "404 error.svg",
};

const translations = {
  en: {
    doc_title: "PDF OCR Preprocessor",
    brand_subtitle: "OCR Workflow",
    nav_workspace: "Workspace",
    nav_dashboard: "Dashboard",
    nav_dashboard_note: "Upload and process PDFs",
    nav_history: "History",
    nav_history_note: "Browse saved sessions",
    nav_logs: "Logs",
    nav_logs_note: "View processing activity",
    nav_settings: "Settings",
    nav_settings_note: "Theme and language",
    profile_eyebrow: "Profile",
    profile_title: "Your Account",
    profile_subtitle: "View your current account, email, and access role for this workspace.",
    profile_name_label: "Display Name",
    profile_email_label: "Email",
    profile_role_label: "Role",
    profile_status_label: "Status",
    profile_login_btn: "Go to Login",
    profile_logout_btn: "Logout",
    profile_status_guest: "Guest",
    profile_status_signed_in: "Signed In",
    guest_user: "Guest User",
    guest_prompt_login: "Click to login",
    role_guest: "guest",
    dashboard_eyebrow: "Document Pipeline",
    dashboard_title: "PDF OCR Preprocessor",
    dashboard_subtitle: "Upload PDF files or images, split PDF pages into images, and preprocess every page for better OCR accuracy.",
    metric_total_pages: "Total Pages",
    metric_total_pages_note: "Across all uploaded PDFs",
    metric_completed: "Completed",
    metric_completed_note: "Processed pages ready to review",
    metric_status: "Status",
    upload_kicker: "Upload",
    upload_title: "Upload Documents for OCR",
    upload_text: "Upload PDF or image files to generate clean, OCR-ready page images.",
    dropzone_title: "Click to upload or drag and drop",
    dropzone_text: "PDF, PNG, JPG, WEBP, BMP, TIFF up to 100MB",
    cancel_btn: "Cancel",
    start_processing_btn: "Start Processing",
    queue_kicker: "Queue",
    queue_title: "Processing Queue",
    queue_text: "Add files in multiple rounds, then process the whole queue together.",
    compare_kicker: "Compare",
    compare_title: "Original vs Processed",
    compare_text: "Select a processed page to inspect the before and after result.",
    output_kicker: "Output",
    output_title: "Processed Pages",
    output_text: "Review page status, inspect each page, and open the compare viewer.",
    history_eyebrow: "History",
    history_title: "Session History",
    history_subtitle: "Sessions found in data/sessions. Remove one item or clear everything.",
    history_card_kicker: "History",
    history_card_title: "Saved Sessions",
    history_card_text: "Browse all uploaded sessions and delete individual items or clear the whole archive.",
    history_clear: "Clear All History",
    logs_eyebrow: "Logs",
    logs_title: "Processing Logs",
    logs_subtitle: "Review upload, OCR, webhook, and processing activity for the current session.",
    logs_card_kicker: "Logs",
    logs_card_title: "Activity Stream",
    logs_card_text: "Latest messages from the active session are shown below.",
    settings_eyebrow: "Settings",
    settings_title: "Workspace Settings",
    settings_subtitle: "Change theme and language for this browser only.",
    settings_card_kicker: "Settings",
    settings_card_title: "Appearance and Language",
    settings_card_text: "Pick the display mode and UI language you want to use.",
    settings_webhook_title: "Webhook Request",
    settings_webhook_text: "Edit the URL, HTTP method, and JSON body fields sent with each processed image when you start processing.",
    settings_webhook_url_label: "Webhook URL",
    settings_webhook_method_label: "HTTP Method",
    settings_webhook_body_label: "Body Fields (JSON)",
    settings_webhook_help: "The processed image file is attached automatically. Available placeholders: {{sessionId}}, {{metadata_json}}, {{page.pageNumber}}, {{page.sourceFileName}}, {{page.processedFilename}}.",
    settings_theme_title: "Theme",
    settings_theme_text: "Switch between a bright and dark workspace.",
    settings_language_title: "Language",
    settings_language_text: "Choose the language used in the interface.",
    theme_light: "Light",
    theme_dark: "Dark",
    language_th: "Thai",
    language_en: "English",
    settings_preview_title: "Current Preferences",
    settings_preview_text: "These choices are saved in your browser and restored on refresh.",
    settings_current_theme: "Theme",
    settings_current_language: "Language",
    button_reset: "Reset",
    button_close: "Close",
    button_download_json: "Download JSON",
    alert_invalid_webhook_body: "Webhook body must be valid JSON.",
    json_table_view: "Table View",
    json_raw_view: "Raw JSON",
    status_idle: "Idle",
    status_uploaded: "Uploaded",
    status_processing: "Processing",
    status_completed: "Completed",
    status_failed: "Failed",
    status_waiting: "Waiting",
    status_queued: "Queued",
    modal_kicker_original: "Original Page",
    modal_kicker_processed: "Processed Page",
    modal_kicker_preview: "Preview",
    modal_kicker_json: "Webhook JSON",
    modal_json_default_title: "n8n Response",
    json_empty: "No JSON response available.",
    json_invalid: "Response is not valid JSON. See raw response below.",
    json_field: "Field",
    json_value: "Value",
    json_type: "Type",
    alert_wait_processing_before_add: "Wait until the current processing job finishes before adding more files.",
    alert_choose_pdf: "Please choose at least one PDF or image file.",
    alert_upload_before_process: "Upload a PDF before starting processing.",
    alert_processing_still_running: "Processing is still running. Wait until it completes before resetting the workspace.",
    confirm_remove_file: "Remove this file from the queue?",
    confirm_delete_history_item: "Delete this history item and its files from data/sessions?",
    confirm_delete_all_history: "Delete all history items and remove every folder inside data/sessions?",
    metric_waiting_for_upload: "Waiting for upload",
    metric_ready_to_start: "Ready to start processing",
    metric_overall_progress: "{completed}/{total} pages processed | {progress} overall",
    metric_processed_ready: "Processed images are ready",
    metric_failed: "Some pages failed during processing",
    metric_sending_n8n: "Processing pages and sending processed images to n8n",
    metric_sent_n8n: "Processed images are ready and image files were sent to n8n",
    metric_send_failed: "Processing finished but sending some images to n8n failed",
    upload_hint_empty: "No files uploaded",
    upload_hint_queue: "{count} file(s) in queue",
    queue_summary: "{count} file(s)",
    queue_empty: "No file uploaded yet.",
    queue_meta: "{size} | {pages} page(s) | {done}/{total} done | {progress}",
    queue_phase_current: "Page {page}/{total} | {phase} | {progress} on current page",
    queue_phase_all_done: "All pages completed",
    queue_phase_next: "Next page {page}/{total} | {phase}",
    queue_phase_queued: "Queued",
    queue_file_label: "File {index} | {progress}",
    queue_remove: "Remove",
    compare_empty: "Select a page after processing to compare original and processed images.",
    compare_original_image: "Original page image",
    compare_processed_image: "Processed page image",
    compare_original_missing: "Original image not available yet.",
    compare_processed_missing: "Processed image not available yet.",
    compare_ocr_confidence: "OCR confidence",
    compare_best_candidate: "Best candidate",
    compare_document_profile: "Document profile",
    compare_deskew_angle: "Deskew angle",
    output_empty: "Processed page previews will appear here after OCR starts.",
    page_label: "Page {page}",
    button_original: "Original",
    button_clean: "Clean",
    button_json: "JSON",
    detail_waiting: "Waiting",
    detail_processing: "Processing",
    detail_document: "Document",
    history_empty: "No saved sessions found.",
    history_preview_empty: "No page previews available yet.",
    history_pages_count: "{count} page(s)",
    history_session_many: "{count} files in session",
    history_session_single: "Session",
    history_session_id: "Session ID: {id}",
    history_created: "Created: {value}",
    history_updated: "Updated: {value}",
    history_files: "Files: {value}",
    history_pages: "Pages: {value}",
    history_processed: "Processed: {value}",
    history_size: "Size: {value}",
    history_documents_many: "{count} documents in this session",
    history_documents_single: "1 document in this session",
    history_delete: "Delete",
    logs_empty: "No processing logs yet.",
    log_level_info: "Info",
  },
  th: {},
};

translations.th = {
  ...translations.en,
  doc_title: "ตัวเตรียมไฟล์ PDF OCR",
  brand_subtitle: "เวิร์กโฟลว์ OCR",
  nav_workspace: "เมนูหลัก",
  nav_dashboard: "แดชบอร์ด",
  nav_dashboard_note: "อัปโหลดและประมวลผล PDF",
  nav_history: "ประวัติ",
  nav_history_note: "ดูเซสชันที่บันทึกไว้",
  nav_logs: "บันทึก",
  nav_logs_note: "ดูการทำงานของระบบ",
  nav_settings: "ตั้งค่า",
  nav_settings_note: "ธีมและภาษา",
  profile_eyebrow: "โปรไฟล์",
  profile_title: "บัญชีของคุณ",
  profile_subtitle: "ดูข้อมูลการเข้าใช้งาน อีเมล และสิทธิ์ของบัญชีนี้",
  profile_name_label: "ชื่อแสดงผล",
  profile_email_label: "อีเมล",
  profile_role_label: "สิทธิ์",
  profile_status_label: "สถานะ",
  profile_login_btn: "ไปหน้าเข้าสู่ระบบ",
  profile_logout_btn: "ออกจากระบบ",
  profile_status_guest: "ผู้ใช้ทั่วไป",
  profile_status_signed_in: "เข้าสู่ระบบแล้ว",
  guest_user: "Guest User",
  guest_prompt_login: "กดเพื่อเข้าสู่ระบบ",
  role_guest: "guest",
  dashboard_eyebrow: "เวิร์กโฟลว์เอกสาร",
  dashboard_title: "ตัวเตรียมไฟล์ PDF OCR",
  dashboard_subtitle: "อัปโหลดไฟล์ PDF หรือรูปภาพ แยกหน้า PDF เป็นรูป และเตรียมภาพทุกหน้าให้พร้อมสำหรับ OCR ได้แม่นยำขึ้น",
  metric_total_pages: "จำนวนหน้าทั้งหมด",
  metric_total_pages_note: "รวมทุกไฟล์ PDF ที่อัปโหลด",
  metric_completed: "เสร็จแล้ว",
  metric_completed_note: "หน้าที่ประมวลผลเสร็จและพร้อมตรวจสอบ",
  metric_status: "สถานะ",
  upload_kicker: "อัปโหลด",
  upload_title: "อัปโหลดเอกสารสำหรับ OCR",
  upload_text: "อัปโหลดไฟล์ PDF หรือรูปภาพ เพื่อสร้างภาพหน้าที่สะอาดและพร้อมสำหรับ OCR",
  dropzone_title: "คลิกเพื่ออัปโหลดหรือลากไฟล์มาวาง",
  dropzone_text: "รองรับ PDF, PNG, JPG, WEBP, BMP, TIFF สูงสุด 100MB",
  cancel_btn: "ยกเลิก",
  start_processing_btn: "เริ่มประมวลผล",
  queue_kicker: "คิวงาน",
  queue_title: "คิวประมวลผล",
  queue_text: "เพิ่มไฟล์ได้หลายรอบ แล้วค่อยประมวลผลทั้งคิวพร้อมกัน",
  compare_kicker: "เปรียบเทียบ",
  compare_title: "ต้นฉบับ vs หลังปรับ",
  compare_text: "เลือกหน้าที่ประมวลผลแล้วเพื่อดูภาพก่อนและหลังปรับ",
  output_kicker: "ผลลัพธ์",
  output_title: "หน้าที่ประมวลผลแล้ว",
  output_text: "ตรวจสอบสถานะของแต่ละหน้า ดูรายละเอียด และเปิดหน้าต่างเปรียบเทียบ",
  history_eyebrow: "ประวัติ",
  history_title: "ประวัติเซสชัน",
  history_subtitle: "แสดงเซสชันที่บันทึกไว้ พร้อมลบทีละรายการหรือล้างทั้งหมด",
  history_card_kicker: "ประวัติ",
  history_card_title: "เซสชันที่บันทึกไว้",
  history_card_text: "ดูทุกเซสชันที่อัปโหลด และลบทีละรายการหรือล้างทั้งคลัง",
  history_clear: "ล้างประวัติทั้งหมด",
  logs_eyebrow: "บันทึก",
  logs_title: "บันทึกการประมวลผล",
  logs_subtitle: "ตรวจสอบกิจกรรมการอัปโหลด OCR webhook และสถานะของเซสชันปัจจุบัน",
  settings_eyebrow: "ตั้งค่า",
  settings_title: "การตั้งค่าระบบ",
  settings_subtitle: "เปลี่ยนธีม ภาษา และการตั้งค่าที่เกี่ยวข้องกับบัญชีนี้",
  settings_card_kicker: "ตั้งค่า",
  settings_card_title: "ธีมและภาษา",
  settings_card_text: "เลือกรูปแบบการแสดงผลและภาษาที่ต้องการใช้งาน",
  settings_theme_title: "ธีม",
  settings_theme_text: "สลับระหว่างโหมดสว่างและโหมดมืด",
  settings_language_title: "ภาษา",
  settings_language_text: "เลือกภาษาที่ใช้ในระบบ",
  settings_preview_title: "ค่าปัจจุบัน",
  settings_preview_text: "ค่าที่เลือกจะถูกบันทึกในเบราว์เซอร์และถูกเรียกกลับหลังรีเฟรช",
  settings_current_theme: "ธีม",
  settings_current_language: "ภาษา",
  theme_light: "สว่าง",
  theme_dark: "มืด",
  language_th: "ไทย",
  language_en: "อังกฤษ",
  button_close: "ปิด",
  button_reset: "รีเซ็ต",
  button_download_json: "ดาวน์โหลด JSON",
  status_idle: "ว่าง",
  status_uploaded: "อัปโหลดแล้ว",
  status_processing: "กำลังประมวลผล",
  status_completed: "เสร็จแล้ว",
  status_failed: "ล้มเหลว",
  status_waiting: "รอ",
  status_queued: "เข้าคิวแล้ว",
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatBytes(size) {
  if (!size) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function normalizeTheme(theme) {
  return theme === "dark" ? "dark" : "light";
}

function normalizeLanguage(language) {
  return language === "th" ? "th" : "en";
}

function getLocale() {
  return LOCALE_BY_LANGUAGE[state.language] || LOCALE_BY_LANGUAGE.en;
}

function t(key, vars = {}) {
  const dict = translations[state.language] || translations.en;
  const fallback = translations.en[key] || key;
  const template = dict[key] || fallback;
  return String(template).replace(/\{(\w+)\}/g, (_, token) => String(vars[token] ?? ""));
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    const value = t(key);
    if (element.tagName === "TITLE") {
      document.title = value;
    } else {
      element.textContent = value;
    }
  });
}

function formatPercent(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return "0%";
  const rounded = Math.round(numeric * 10) / 10;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString(getLocale());
}

function formatStatus(status) {
  const normalized = status || "idle";
  const dict = translations[state.language] || translations.en;
  const key = `status_${normalized}`;
  if (dict[key] || translations.en[key]) {
    return t(key);
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function statusBadge(status) {
  return `<span class="badge ${status}">${escapeHtml(formatStatus(status))}</span>`;
}

function actionIcon(kind) {
  if (kind === "original") {
    return `
      <span class="action-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z"/>
          <circle cx="12" cy="12" r="2.8"/>
        </svg>
      </span>
    `;
  }

  return `
    <span class="action-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="m12 3 1.9 4.4L18 9.3l-4.1 1.8L12 15.5l-1.9-4.4L6 9.3l4.1-1.9L12 3Z"/>
        <path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/>
      </svg>
    </span>
  `;
}

function imageActionLabel(kind) {
  return kind === "original" ? t("button_original") : t("button_clean");
}

function formatPageTitle(fileName, pageNumber) {
  return `${fileName} | ${t("page_label", { page: pageNumber })}`;
}

function truncateFilename(value, maxLength = 56) {
  if (!value || value.length <= maxLength) {
    return value || "";
  }

  const extensionIndex = value.lastIndexOf(".");
  const hasExtension = extensionIndex > 0 && extensionIndex < value.length - 1;
  const extension = hasExtension ? value.slice(extensionIndex) : "";
  const baseName = hasExtension ? value.slice(0, extensionIndex) : value;
  const reserved = extension.length + 1;
  const available = maxLength - reserved;

  if (available < 12) {
    return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
  }

  const front = Math.ceil(available * 0.65);
  const back = Math.max(4, available - front);
  return `${baseName.slice(0, front)}...${baseName.slice(-back)}${extension}`;
}

function sanitizeDownloadName(value, fallback = "webhook-response") {
  const normalized = String(value || fallback)
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return normalized || fallback;
}

function getJsonModalDownloadData() {
  if (state.jsonModalExternal) {
    const title = state.jsonModalExternal.title || t("modal_json_default_title");
    if (state.jsonModalExternal.payload !== null && state.jsonModalExternal.payload !== undefined) {
      return {
        filename: `${sanitizeDownloadName(title)}.json`,
        content: JSON.stringify(state.jsonModalExternal.payload, null, 2),
      };
    }
    if (state.jsonModalExternal.raw) {
      return {
        filename: `${sanitizeDownloadName(title)}.json`,
        content: state.jsonModalExternal.raw,
      };
    }
    return null;
  }

  const page = getPageById(state.jsonModalPageId);
  if (!page) return null;

  const title = formatPageTitle(page.fileName, page.pageNumber);
  if (page.webhookResponseJson !== null && page.webhookResponseJson !== undefined) {
    return {
      filename: `${sanitizeDownloadName(title)}.json`,
      content: JSON.stringify(page.webhookResponseJson, null, 2),
    };
  }
  if (page.webhookResponseRaw) {
    return {
      filename: `${sanitizeDownloadName(title)}.json`,
      content: page.webhookResponseRaw,
    };
  }
  return null;
}

function downloadJsonModalPayload() {
  const payload = getJsonModalDownloadData();
  if (!payload) return;

  const blob = new Blob([payload.content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = payload.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function isSupportedUploadFile(file) {
  const fileName = String(file?.name || "").toLowerCase();
  return SUPPORTED_UPLOAD_SUFFIXES.some((suffix) => fileName.endsWith(suffix));
}

function jsonActionIcon() {
  return `
    <span class="action-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 8 4 12l4 4"/>
        <path d="m16 8 4 4-4 4"/>
        <path d="m14 4-4 16"/>
      </svg>
    </span>
  `;
}

function saveActiveSessionId(sessionId) {
  if (sessionId) {
    window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, sessionId);
  } else {
    window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
  }
}

function getActiveSessionId() {
  return window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY) || "";
}

function normalizePageName(page) {
  if (page === "login-google") return "login";
  if (page === "login") return "login";
  if (page === "profile") return "profile";
  if (page === "history") return "history";
  if (page === "logs") return "logs";
  if (page === "settings") return "settings";
  return "dashboard";
}

function getRawHashName() {
  return window.location.hash.replace("#", "").trim().toLowerCase();
}

function getPageFromLocation() {
  const hash = window.location.hash.replace("#", "").trim().toLowerCase();
  if (hash) return normalizePageName(hash);
  return normalizePageName(window.localStorage.getItem(ACTIVE_PAGE_STORAGE_KEY) || "dashboard");
}

function setSession(session) {
  state.session = session;
  saveActiveSessionId(session?.sessionId || "");
}

function normalizeWebhookMethod(method) {
  const normalized = String(method || DEFAULT_WEBHOOK_SETTINGS.method).trim().toUpperCase();
  return WEBHOOK_METHOD_OPTIONS.includes(normalized) ? normalized : DEFAULT_WEBHOOK_SETTINGS.method;
}

function getDefaultWebhookSettings() {
  return {
    url: DEFAULT_WEBHOOK_SETTINGS.url,
    method: DEFAULT_WEBHOOK_SETTINGS.method,
    body: DEFAULT_WEBHOOK_SETTINGS.body,
  };
}

function loadWebhookSettingsFromStorage() {
  const defaults = getDefaultWebhookSettings();
  return {
    url: window.localStorage.getItem(ACTIVE_WEBHOOK_URL_STORAGE_KEY) || defaults.url,
    method: normalizeWebhookMethod(window.localStorage.getItem(ACTIVE_WEBHOOK_METHOD_STORAGE_KEY) || defaults.method),
    body: window.localStorage.getItem(ACTIVE_WEBHOOK_BODY_STORAGE_KEY) || defaults.body,
  };
}

function saveWebhookSettings(settings) {
  window.localStorage.setItem(ACTIVE_WEBHOOK_URL_STORAGE_KEY, settings.url);
  window.localStorage.setItem(ACTIVE_WEBHOOK_METHOD_STORAGE_KEY, settings.method);
  window.localStorage.setItem(ACTIVE_WEBHOOK_BODY_STORAGE_KEY, settings.body);
}

function setWebhookSettings(settings) {
  state.webhookSettings = {
    url: String(settings?.url || "").trim(),
    method: normalizeWebhookMethod(settings?.method),
    body: String(settings?.body || ""),
  };
  saveWebhookSettings(state.webhookSettings);
}

function getWebhookSettingsPayload() {
  if (String(readCurrentUser().role || "").trim().toLowerCase() !== "admin") {
    return getDefaultWebhookSettings();
  }
  return {
    url: String(state.webhookSettings?.url || "").trim(),
    method: normalizeWebhookMethod(state.webhookSettings?.method),
    body: String(state.webhookSettings?.body || ""),
  };
}

function setTheme(theme) {
  state.theme = normalizeTheme(theme);
  document.body.dataset.theme = state.theme;
  window.localStorage.setItem(ACTIVE_THEME_STORAGE_KEY, state.theme);
}

function setLanguage(language) {
  state.language = normalizeLanguage(language);
  document.documentElement.lang = state.language;
  window.localStorage.setItem(ACTIVE_LANGUAGE_STORAGE_KEY, state.language);
  applyTranslations();
}

function setActivePage(page, syncHash = true) {
  state.activePage = normalizePageName(page);
  window.localStorage.setItem(ACTIVE_PAGE_STORAGE_KEY, state.activePage);
  if (els.loginPage) {
    els.loginPage.hidden = state.activePage !== "login";
  }
  if (els.profilePage) {
    els.profilePage.hidden = state.activePage !== "profile";
  }
  els.dashboardPage.hidden = state.activePage !== "dashboard";
  els.historyPage.hidden = state.activePage !== "history";
  els.logsPage.hidden = state.activePage !== "logs";
  els.settingsPage.hidden = state.activePage !== "settings";
  document.body.dataset.activePage = state.activePage;

  document.querySelectorAll(".nav-item[data-page]").forEach((button) => {
    button.classList.toggle("active", normalizePageName(button.dataset.page) === state.activePage);
  });

  if (syncHash) {
    const nextHash = state.activePage === "login"
      ? "#login"
      : state.activePage === "profile"
      ? "#profile"
      : state.activePage === "history"
      ? "#history"
      : state.activePage === "logs"
        ? "#logs"
        : state.activePage === "settings"
          ? "#settings"
        : "#dashboard";
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, "", nextHash);
    }
  }

  if (state.activePage === "profile") {
    renderProfile();
    void refreshCurrentUser();
  } else if (state.activePage === "history") {
    void refreshHistory();
  } else if (state.activePage === "login") {
    void ensureLatestGoogleLoginSettings();
  }
}

function initializePreferences() {
  setTheme(window.localStorage.getItem(ACTIVE_THEME_STORAGE_KEY) || "light");
  setLanguage(window.localStorage.getItem(ACTIVE_LANGUAGE_STORAGE_KEY) || "en");
  setWebhookSettings(loadWebhookSettingsFromStorage());
}

function showInlineMessage(element, message, type = "info") {
  if (!element) return;
  element.hidden = false;
  element.className = `settings-feedback settings-feedback-${type}`;
  element.textContent = message;
}

function hideInlineMessage(element) {
  if (!element) return;
  element.hidden = true;
  element.textContent = "";
  element.className = "settings-feedback";
}

function getLoginEmailValue() {
  const modernValue = String(els.loginEmailModern?.value || "").trim();
  if (modernValue) return modernValue;
  return String(els.loginEmail?.value || "").trim();
}

function syncLoginEmailFields(value) {
  if (els.loginEmail) {
    els.loginEmail.value = value;
  }
  if (els.loginEmailModern) {
    els.loginEmailModern.value = value;
  }
}

function syncModernLoginControls() {
  if (els.loginGoogleBtnModern && els.loginGoogleBtn) {
    els.loginGoogleBtnModern.disabled = els.loginGoogleBtn.disabled;
  }
  if (els.loginGoogleNoteModern && els.loginGoogleNote) {
    els.loginGoogleNoteModern.textContent = els.loginGoogleNote.textContent;
  }
}

function getDefaultGoogleLoginSettings() {
  const origin = window.location.origin || "http://127.0.0.1:8000";
  return {
    ...DEFAULT_GOOGLE_LOGIN_SETTINGS,
    javaScriptOrigin: origin,
    redirectUri: `${origin}/#dashboard`,
    loginUrl: `${origin}/#login-google`,
    successUrl: `${origin}/#dashboard`,
  };
}

function readLegacyGoogleLoginSettingsFromStorage() {
  const defaults = getDefaultGoogleLoginSettings();
  const storedOrigin = window.localStorage.getItem(GOOGLE_JAVASCRIPT_ORIGIN_STORAGE_KEY) || defaults.javaScriptOrigin;
  const storedRedirectUri = window.localStorage.getItem(GOOGLE_REDIRECT_URI_STORAGE_KEY) || defaults.redirectUri;
  const storedLoginUrl = window.localStorage.getItem(GOOGLE_LOGIN_URL_STORAGE_KEY) || defaults.loginUrl;
  const storedSuccessUrl = window.localStorage.getItem(GOOGLE_LOGIN_SUCCESS_URL_STORAGE_KEY) || defaults.successUrl;
  const normalizedInternalLoginUrl = (() => {
    try {
      const parsed = new URL(storedLoginUrl, window.location.origin);
      if (parsed.origin === window.location.origin && parsed.pathname === "/oauth2/authorization/google") {
        return defaults.loginUrl;
      }
    } catch {
      return storedLoginUrl;
    }
    return storedLoginUrl;
  })();
  return {
    enabled: window.localStorage.getItem(GOOGLE_LOGIN_ENABLED_STORAGE_KEY) === "true",
    clientId: window.localStorage.getItem(GOOGLE_CLIENT_ID_STORAGE_KEY) || defaults.clientId,
    clientSecret: window.localStorage.getItem(GOOGLE_CLIENT_SECRET_STORAGE_KEY) || defaults.clientSecret,
    javaScriptOrigin: storedOrigin === "http://127.0.0.1:8000" ? defaults.javaScriptOrigin : storedOrigin,
    redirectUri: storedRedirectUri === "http://localhost:8080/login/oauth2/code/google" ? defaults.redirectUri : storedRedirectUri,
    loginUrl: normalizedInternalLoginUrl === "http://localhost:8080/oauth2/authorization/google" ? defaults.loginUrl : normalizedInternalLoginUrl,
    successUrl: storedSuccessUrl === "http://127.0.0.1:8000/#dashboard" ? defaults.successUrl : storedSuccessUrl,
    adminEmailList: window.localStorage.getItem(ADMIN_EMAIL_LIST_STORAGE_KEY) || defaults.adminEmailList,
  };
}

function hasMeaningfulGoogleLoginSettings(settings) {
  if (!settings) return false;
  return Boolean(
    settings.enabled ||
    settings.clientId ||
    settings.clientSecret ||
    settings.javaScriptOrigin ||
    settings.redirectUri ||
    settings.loginUrl ||
    settings.successUrl ||
    settings.adminEmailList,
  );
}

function normalizeGoogleLoginSettings(settings = {}) {
  const defaults = getDefaultGoogleLoginSettings();
  const merged = {
    ...defaults,
    ...settings,
  };
  return {
    enabled: Boolean(merged.enabled),
    clientId: String(merged.clientId || "").trim(),
    clientSecret: String(merged.clientSecret || ""),
    javaScriptOrigin: String(merged.javaScriptOrigin || "").trim() || defaults.javaScriptOrigin,
    redirectUri: String(merged.redirectUri || "").trim() || defaults.redirectUri,
    loginUrl: String(merged.loginUrl || "").trim() || defaults.loginUrl,
    successUrl: String(merged.successUrl || "").trim() || defaults.successUrl,
    adminEmailList: String(merged.adminEmailList || "").replace(/\r\n/g, "\n"),
  };
}

function readGoogleLoginSettings() {
  if (state.googleLoginSettings) {
    return normalizeGoogleLoginSettings(state.googleLoginSettings);
  }
  return normalizeGoogleLoginSettings(readLegacyGoogleLoginSettingsFromStorage());
}

function setGoogleLoginSettings(settings) {
  state.googleLoginSettings = normalizeGoogleLoginSettings(settings);
  return state.googleLoginSettings;
}

function readGoogleLoginSettingsFromForm() {
  return {
    enabled: Boolean(els.googleLoginEnabled?.checked),
    clientId: String(els.googleClientId?.value || "").trim(),
    clientSecret: String(els.googleClientSecret?.value || ""),
    javaScriptOrigin: String(els.googleJavaScriptOrigin?.value || "").trim(),
    redirectUri: String(els.googleRedirectUri?.value || "").trim(),
    loginUrl: String(els.googleLoginUrl?.value || "").trim(),
    successUrl: String(els.googleLoginSuccessUrl?.value || "").trim(),
    adminEmailList: String(els.adminEmailList?.value || "").replace(/\r\n/g, "\n"),
  };
}

function writeGoogleLoginSettingsToLegacyStorage(settings) {
  const normalized = normalizeGoogleLoginSettings(settings);
  window.localStorage.setItem(GOOGLE_LOGIN_ENABLED_STORAGE_KEY, normalized.enabled ? "true" : "false");
  window.localStorage.setItem(GOOGLE_CLIENT_ID_STORAGE_KEY, normalized.clientId);
  window.localStorage.setItem(GOOGLE_CLIENT_SECRET_STORAGE_KEY, normalized.clientSecret);
  window.localStorage.setItem(GOOGLE_JAVASCRIPT_ORIGIN_STORAGE_KEY, normalized.javaScriptOrigin);
  window.localStorage.setItem(GOOGLE_REDIRECT_URI_STORAGE_KEY, normalized.redirectUri);
  window.localStorage.setItem(GOOGLE_LOGIN_URL_STORAGE_KEY, normalized.loginUrl);
  window.localStorage.setItem(GOOGLE_LOGIN_SUCCESS_URL_STORAGE_KEY, normalized.successUrl);
  window.localStorage.setItem(ADMIN_EMAIL_LIST_STORAGE_KEY, normalized.adminEmailList);
}

async function fetchGoogleLoginSettingsFromServer() {
  const response = await fetch("/api/settings/google-login", {
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to load Google Login settings (${response.status}).`);
  }
  return normalizeGoogleLoginSettings(await response.json());
}

async function fetchPublicGoogleLoginSettingsFromServer() {
  const response = await fetch("/api/public/google-login", {
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to load Google Login config (${response.status}).`);
  }
  const payload = await response.json();
  return normalizeGoogleLoginSettings({
    ...getDefaultGoogleLoginSettings(),
    ...payload,
    clientSecret: "",
    adminEmailList: "",
  });
}

async function saveGoogleLoginSettingsToServer(settings) {
  const response = await fetch("/api/settings/google-login", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(normalizeGoogleLoginSettings(settings)),
  });
  if (!response.ok) {
    throw new Error(`Failed to save Google Login settings (${response.status}).`);
  }
  return normalizeGoogleLoginSettings(await response.json());
}

function fillGoogleLoginForm(settings) {
  if (!els.googleLoginEnabled) return;
  els.googleLoginEnabled.checked = Boolean(settings.enabled);
  els.googleClientId.value = settings.clientId;
  els.googleClientSecret.value = settings.clientSecret;
  els.googleJavaScriptOrigin.value = settings.javaScriptOrigin;
  els.googleRedirectUri.value = settings.redirectUri;
  els.googleLoginUrl.value = settings.loginUrl;
  els.googleLoginSuccessUrl.value = settings.successUrl;
  els.adminEmailList.value = settings.adminEmailList;
}

async function ensureLatestGoogleLoginSettings() {
  if (currentUserIsAdmin()) {
    try {
      setGoogleLoginSettings(await fetchGoogleLoginSettingsFromServer());
    } catch {
      setGoogleLoginSettings(normalizeGoogleLoginSettings(readLegacyGoogleLoginSettingsFromStorage()));
    }
  } else {
    try {
      setGoogleLoginSettings(await fetchPublicGoogleLoginSettingsFromServer());
    } catch {
      setGoogleLoginSettings(normalizeGoogleLoginSettings(readLegacyGoogleLoginSettingsFromStorage()));
    }
  }
  state.googleGisChecked = false;
  updateGoogleLoginStatus();
  updateGoogleLoginButtonState();
  return readGoogleLoginSettings();
}

async function refreshGoogleLoginAvailability() {
  const settings = readGoogleLoginSettings();
  const configured = settings.enabled && Boolean(settings.clientId) && Boolean(settings.loginUrl);
  const requiresFrontendGis = !settings.loginUrl || isInternalGoogleLoginUrl(settings.loginUrl);

  state.googleGisChecked = true;
  if (!configured) {
    state.googleGisReady = false;
    updateGoogleLoginButtonState();
    return false;
  }

  if (!requiresFrontendGis) {
    state.googleGisReady = true;
    updateGoogleLoginButtonState();
    return true;
  }

  try {
    await waitForGoogleIdentityServices();
    state.googleGisReady = true;
  } catch {
    state.googleGisReady = false;
  }
  updateGoogleLoginButtonState();
  return state.googleGisReady;
}

async function loadGoogleLoginSettings() {
  if (!currentUserIsAdmin()) {
    try {
      setGoogleLoginSettings(await fetchPublicGoogleLoginSettingsFromServer());
    } catch {
      setGoogleLoginSettings(normalizeGoogleLoginSettings(readLegacyGoogleLoginSettingsFromStorage()));
    }
    hideInlineMessage(els.googleSettingsFeedback);
    updateGoogleLoginStatus();
    updateGoogleLoginButtonState();
    void refreshGoogleLoginAvailability();
    return;
  }
  const legacySettings = normalizeGoogleLoginSettings(readLegacyGoogleLoginSettingsFromStorage());
  try {
    let serverSettings = await fetchGoogleLoginSettingsFromServer();
    if (!hasMeaningfulGoogleLoginSettings(serverSettings) && hasMeaningfulGoogleLoginSettings(legacySettings)) {
      serverSettings = await saveGoogleLoginSettingsToServer(legacySettings);
    }
    setGoogleLoginSettings(serverSettings);
  } catch (error) {
    setGoogleLoginSettings(legacySettings);
    showInlineMessage(els.googleSettingsFeedback, error.message, "info");
  }
  fillGoogleLoginForm(readGoogleLoginSettings());
  updateGoogleLoginStatus();
  updateGoogleLoginButtonState();
  void refreshGoogleLoginAvailability();
}

async function saveGoogleLoginSettings() {
  if (!currentUserIsAdmin()) {
    throw new Error("Admin access required.");
  }
  const settings = readGoogleLoginSettingsFromForm();
  if (settings.clientId && !settings.clientId.includes(".apps.googleusercontent.com")) {
    window.alert("Google Client ID ดูไม่ถูกต้อง");
    return;
  }
  if (settings.javaScriptOrigin && !/^https?:\/\//i.test(settings.javaScriptOrigin)) {
    window.alert("Authorized JavaScript Origin ต้องขึ้นต้นด้วย http:// หรือ https://");
    return;
  }
  if (settings.redirectUri && !/^https?:\/\//i.test(settings.redirectUri)) {
    window.alert("Authorized Redirect URI ต้องขึ้นต้นด้วย http:// หรือ https://");
    return;
  }
  if (settings.loginUrl && !/^https?:\/\//i.test(settings.loginUrl)) {
    window.alert("Backend Google Login URL ต้องขึ้นต้นด้วย http:// หรือ https://");
    return;
  }
  if (settings.successUrl && !/^https?:\/\//i.test(settings.successUrl)) {
    window.alert("Frontend Login Success URL ต้องขึ้นต้นด้วย http:// หรือ https://");
    return;
  }

  const savedSettings = await saveGoogleLoginSettingsToServer(settings);
  setGoogleLoginSettings(savedSettings);
  writeGoogleLoginSettingsToLegacyStorage(savedSettings);
  updateGoogleLoginStatus();
  updateGoogleLoginButtonState();
  showInlineMessage(els.googleSettingsFeedback, "บันทึกการตั้งค่าเรียบร้อยแล้ว", "success");
}

function getAdminEmailsFromSettings() {
  const rawValue = readGoogleLoginSettings().adminEmailList || "";
  return rawValue
    .split(/\r?\n/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function getUserRoleByEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return "user";
  return getAdminEmailsFromSettings().includes(normalizedEmail) ? "admin" : "user";
}

function updateGoogleLoginStatus() {
  if (!els.googleLoginStatusBox) return;
  const settings = els.googleLoginEnabled ? readGoogleLoginSettingsFromForm() : readGoogleLoginSettings();
  const ready = settings.enabled && Boolean(settings.clientId) && Boolean(settings.loginUrl);
  els.googleLoginStatusBox.classList.toggle("settings-status-box-ready", ready);
  els.googleLoginStatusBox.classList.toggle("settings-status-box-pending", !ready);
  els.googleLoginStatusTitle.textContent = ready ? "พร้อมใช้งาน Google Login" : "ยังตั้งค่า Google Login ไม่ครบ";
  els.googleLoginStatusText.textContent = ready
    ? "ระบบพร้อมเปิดปุ่ม Google Sign-In และส่งผู้ใช้ไปยัง Backend Google Login URL"
    : "กรอก Client ID และ Backend Google Login URL พร้อมเปิดใช้งาน Google Login ก่อน";
}

function updateGoogleLoginButtonState() {
  if (!els.loginGoogleBtn) return;
  const settings = readGoogleLoginSettings();
  const isConfigured = settings.enabled && Boolean(settings.clientId) && Boolean(settings.loginUrl);
  const requiresFrontendGis = !settings.loginUrl || isInternalGoogleLoginUrl(settings.loginUrl);
  const isReady = isConfigured && (!requiresFrontendGis || state.googleGisReady);
  const note = !isConfigured
    ? "Google Login is not enabled yet."
    : requiresFrontendGis && !state.googleGisReady
      ? "Google Sign-In is loading..."
      : "Google Login is ready to use.";

  els.loginGoogleBtn.disabled = !isReady;
  els.loginGoogleBtn.setAttribute("aria-disabled", isReady ? "false" : "true");
  els.loginGoogleBtn.dataset.googleEnabled = isReady ? "true" : "false";
  if (els.loginGoogleBtnModern) {
    els.loginGoogleBtnModern.disabled = !isReady;
    els.loginGoogleBtnModern.setAttribute("aria-disabled", isReady ? "false" : "true");
    els.loginGoogleBtnModern.dataset.googleEnabled = isReady ? "true" : "false";
  }
  els.loginGoogleNote.textContent = note;
  syncModernLoginControls();
}

function testGoogleLoginUrl() {
  const url = String(els.googleLoginUrl?.value || readGoogleLoginSettings().loginUrl || "").trim();
  if (!url) {
    window.alert("กรุณาตั้งค่า Google Login ก่อน");
    return;
  }
  const confirmed = window.confirm(`เปิด URL นี้ในแท็บใหม่หรือไม่?\n\n${url}`);
  if (!confirmed) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

async function copyRedirectUri() {
  const value = String(els.googleRedirectUri?.value || "").trim();
  if (!value) {
    window.alert("ยังไม่มี Redirect URI");
    return;
  }
  await navigator.clipboard.writeText(value);
  showInlineMessage(els.googleSettingsFeedback, "คัดลอก Redirect URI แล้ว", "info");
}

async function copyJavaScriptOrigin() {
  const value = String(els.googleJavaScriptOrigin?.value || "").trim();
  if (!value) {
    window.alert("ยังไม่มี JavaScript Origin");
    return;
  }
  await navigator.clipboard.writeText(value);
  showInlineMessage(els.googleSettingsFeedback, "คัดลอก JavaScript Origin แล้ว", "info");
}

function toggleClientSecretVisibility() {
  if (!els.googleClientSecret) return;
  const nextType = els.googleClientSecret.type === "password" ? "text" : "password";
  els.googleClientSecret.type = nextType;
  if (els.googleSecretToggle) {
    els.googleSecretToggle.textContent = nextType === "password" ? "Show" : "Hide";
  }
}

function readCurrentUser() {
  if (state.currentUser) {
    return {
      name: state.currentUser.name || "",
      email: state.currentUser.email || "",
      role: state.currentUser.role || "user",
    };
  }
  return {
    name: window.localStorage.getItem(CURRENT_USER_NAME_STORAGE_KEY) || "",
    email: window.localStorage.getItem(CURRENT_USER_EMAIL_STORAGE_KEY) || "",
    role: window.localStorage.getItem(CURRENT_USER_ROLE_STORAGE_KEY) || "user",
  };
}

function currentUserIsAdmin() {
  return String(readCurrentUser().role || "").trim().toLowerCase() === "admin";
}

function readRememberedGoogleIdentity() {
  return {
    email: String(window.localStorage.getItem(LAST_GOOGLE_LOGIN_EMAIL_STORAGE_KEY) || "").trim(),
    name: String(window.localStorage.getItem(LAST_GOOGLE_LOGIN_NAME_STORAGE_KEY) || "").trim(),
  };
}

function writeRememberedGoogleIdentity(email, name = "") {
  const normalizedEmail = String(email || "").trim();
  const normalizedName = String(name || "").trim();
  if (!normalizedEmail) {
    window.localStorage.removeItem(LAST_GOOGLE_LOGIN_EMAIL_STORAGE_KEY);
    window.localStorage.removeItem(LAST_GOOGLE_LOGIN_NAME_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(LAST_GOOGLE_LOGIN_EMAIL_STORAGE_KEY, normalizedEmail);
  window.localStorage.setItem(LAST_GOOGLE_LOGIN_NAME_STORAGE_KEY, normalizedName);
}

function applyRememberedGoogleIdentityToLogin() {
  const remembered = readRememberedGoogleIdentity();
  if (!remembered.email) return;
  if (els.loginEmail && !String(els.loginEmail.value || "").trim()) {
    els.loginEmail.value = remembered.email;
  }
  if (els.loginEmailModern && !String(els.loginEmailModern.value || "").trim()) {
    els.loginEmailModern.value = remembered.email;
  }
}

function writeCurrentUserToStorage(user) {
  if (!user) {
    window.localStorage.removeItem(CURRENT_USER_NAME_STORAGE_KEY);
    window.localStorage.removeItem(CURRENT_USER_EMAIL_STORAGE_KEY);
    window.localStorage.removeItem(CURRENT_USER_ROLE_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(CURRENT_USER_NAME_STORAGE_KEY, String(user.name || ""));
  window.localStorage.setItem(CURRENT_USER_EMAIL_STORAGE_KEY, String(user.email || ""));
  window.localStorage.setItem(CURRENT_USER_ROLE_STORAGE_KEY, String(user.role || "user"));
}

function setCurrentUser(user) {
  state.currentUser = user
    ? {
        name: String(user.name || "").trim(),
        email: String(user.email || "").trim(),
        role: String(user.role || "user").trim() || "user",
      }
    : null;
  writeCurrentUserToStorage(state.currentUser);
}

function renderCurrentUser() {
  if (!els.loginCurrentEmail || !els.loginCurrentRole) return;
  const user = readCurrentUser();
  const isLoggedIn = Boolean(user.email);
  const displayName = user.name || (user.email ? user.email.split("@")[0] : t("guest_user"));
  if (els.loginCurrentName) {
    els.loginCurrentName.textContent = displayName || "-";
  }
  if (els.loginCurrentNameModern) {
    els.loginCurrentNameModern.textContent = displayName || "-";
  }
  els.loginCurrentEmail.textContent = user.email || "-";
  if (els.loginCurrentEmailModern) {
    els.loginCurrentEmailModern.textContent = user.email || "-";
  }
  els.loginCurrentRole.textContent = isLoggedIn ? (user.role || "user") : t("role_guest");
  if (els.loginCurrentRoleModern) {
    els.loginCurrentRoleModern.textContent = isLoggedIn ? (user.role || "user") : t("role_guest");
  }
  if (els.sidebarUserCard && els.sidebarUserName && els.sidebarUserEmail && els.sidebarUserRole && els.sidebarUserAvatar) {
    els.sidebarUserCard.hidden = false;
    els.sidebarUserName.textContent = displayName || "-";
    els.sidebarUserEmail.textContent = user.email || t("guest_prompt_login");
    els.sidebarUserRole.textContent = isLoggedIn ? (user.role || "user") : t("role_guest");
    els.sidebarUserAvatar.textContent = (displayName || "W").trim().charAt(0).toUpperCase();
    els.sidebarUserCard.setAttribute("aria-label", isLoggedIn ? t("profile_title") : t("profile_login_btn"));
  }
}

function renderProfile() {
  if (!els.profileName || !els.profileEmail || !els.profileRole) return;
  const user = readCurrentUser();
  const isLoggedIn = Boolean(user.email);
  const displayName = user.name || (user.email ? user.email.split("@")[0] : t("guest_user"));
  const role = isLoggedIn ? (user.role || "user") : t("role_guest");
  const status = isLoggedIn ? t("profile_status_signed_in") : t("profile_status_guest");

  if (els.profileAvatar) {
    els.profileAvatar.textContent = (displayName || "G").trim().charAt(0).toUpperCase();
  }
  els.profileName.textContent = displayName;
  els.profileEmail.textContent = user.email || t("guest_prompt_login");
  els.profileRole.textContent = role;
  if (els.profileNameDetail) els.profileNameDetail.textContent = displayName;
  if (els.profileEmailDetail) els.profileEmailDetail.textContent = user.email || "-";
  if (els.profileRoleDetail) els.profileRoleDetail.textContent = role;
  if (els.profileStatusDetail) els.profileStatusDetail.textContent = status;
  if (els.profileLoginBtn) els.profileLoginBtn.hidden = isLoggedIn;
  if (els.profileLogoutBtn) els.profileLogoutBtn.hidden = !isLoggedIn;
}

function clearClientSessionState() {
  stopPolling();
  setSession(null);
  state.selectedPageId = null;
  state.compareMode = "auto";
  state.modalExternal = null;
  state.modalPageId = null;
  state.jsonModalExternal = null;
  state.jsonModalPageId = null;
  closeImageModal();
  closeJsonModal();
}

async function handleLogout() {
  try {
    await api("/api/auth/logout", {
      method: "POST",
    });
  } catch (error) {
    console.error(error);
  }

  setCurrentUser(null);
  clearClientSessionState();
  hideInlineMessage(els.profileFeedback);
  render();
  await refreshHistory();
  setActivePage("login");
}

function handleSidebarUserCardActivate() {
  const user = readCurrentUser();
  setActivePage(user.email ? "profile" : "login");
  if (user.email) {
    void refreshCurrentUser();
  }
}

function isInternalGoogleLoginUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin && parsed.hash.replace("#", "").trim().toLowerCase() === "login-google";
  } catch {
    return false;
  }
}

function waitForGoogleIdentityServices(timeoutMs = GOOGLE_GIS_WAIT_TIMEOUT_MS) {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve(window.google.accounts.oauth2);
  }

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        window.clearInterval(timer);
        resolve(window.google.accounts.oauth2);
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        window.clearInterval(timer);
        reject(new Error("Google Identity Services is still loading."));
      }
    }, GOOGLE_GIS_POLL_INTERVAL_MS);
  });
}

async function completeGoogleSignInWithAccessToken(accessToken) {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error("Unable to read Google user profile.");
  }

  const profile = await response.json();
  const displayName = String(profile?.name || "").trim();
  const email = String(profile?.email || "").trim();
  if (!email) {
    throw new Error("Google account did not return an email address.");
  }

  writeRememberedGoogleIdentity(email, displayName);
  syncLoginEmailFields(email);
  const user = await loginOnServer(email, displayName, "google", "", accessToken);
  const role = user?.role || getUserRoleByEmail(email);
  showInlineMessage(els.loginFeedback, `เข้าสู่ระบบด้วย Google สำเร็จ: ${email} (${role})`, "success");
  showInlineMessage(els.loginFeedbackModern, `Signed in with Google: ${email} (${role})`, "success");
  redirectToLoginSuccessUrl();
}

async function launchFrontendGooglePopup() {
  const settings = readGoogleLoginSettings();
  if (!settings.enabled) {
    window.alert("Google Login ยังไม่เปิดใช้งาน");
    return;
  }
  if (!settings.clientId) {
    window.alert("กรุณาตั้งค่า Google Client ID ก่อน");
    return;
  }
  if (false && !window.google?.accounts?.oauth2) {
    window.alert("Google Identity Services ยังโหลดไม่เสร็จ");
    return;
  }

  const oauth2 = await waitForGoogleIdentityServices().catch((error) => {
    window.alert(error.message);
    return null;
  });
  if (!oauth2) {
    return;
  }

  const tokenClient = oauth2.initTokenClient({
    client_id: settings.clientId,
    scope: "openid email profile",
    callback: async (tokenResponse) => {
      if (!tokenResponse?.access_token) {
        window.alert("Google Login ไม่สำเร็จ");
        return;
      }
      try {
        await completeGoogleSignInWithAccessToken(tokenResponse.access_token);
      } catch (error) {
        window.alert(error.message);
      }
    },
    error_callback: () => {
      window.alert("Google Login ไม่สำเร็จ");
    },
  });

  tokenClient.requestAccessToken({ prompt: "consent" });
}

function redirectToLoginSuccessUrl() {
  const successUrl = readGoogleLoginSettings().successUrl || DEFAULT_GOOGLE_LOGIN_SETTINGS.successUrl;
  if (!successUrl) {
    setActivePage("dashboard");
    render();
    return;
  }
  window.location.assign(successUrl);
}

async function handleDemoLogin() {
  const remembered = readRememberedGoogleIdentity();
  let email = getLoginEmailValue();
  if (!email) {
    window.alert("Please enter your email before signing in.");
    return;
  }
  syncLoginEmailFields(email);
  const rememberedMatches = remembered.email && remembered.email.trim().toLowerCase() === email.trim().toLowerCase();
  const displayName = (rememberedMatches ? remembered.name : "") || email.split("@")[0]?.trim() || email;
  const user = await loginOnServer(email, displayName, "email");
  const role = user?.role || getUserRoleByEmail(email);
  showInlineMessage(els.loginFeedbackModern, `Signed in with email: ${email} (${role})`, "success");
  showInlineMessage(els.loginFeedback, `Signed in with email: ${email} (${role})`, "success");
  redirectToLoginSuccessUrl();
}

async function handleGoogleSignIn() {
  const settings = await ensureLatestGoogleLoginSettings();
  if (!settings.enabled) {
    window.alert("Google Login is not enabled yet.");
    return;
  }
  if (!settings.clientId) {
    window.alert("Please configure Google Client ID first.");
    return;
  }
  if (!settings.loginUrl || isInternalGoogleLoginUrl(settings.loginUrl)) {
    void launchFrontendGooglePopup();
    return;
  }
  window.location.assign(settings.loginUrl);
}

function maybeAutoLaunchGoogleLogin() {
  if (getRawHashName() !== "login-google") return;
  setActivePage("login", false);
  window.requestAnimationFrame(() => {
    void ensureLatestGoogleLoginSettings().then(() => {
      void launchFrontendGooglePopup();
    });
  });
}

function flattenPages() {
  if (!state.session) return [];
  return state.session.files.flatMap((file) =>
    file.pageItems.map((page) => ({
      ...page,
      fileId: file.id,
      fileName: file.name,
    })),
  );
}

function canAppendToCurrentSession() {
  return Boolean(state.session && state.session.status !== "processing");
}

function getSelectedPage() {
  const pages = flattenPages();
  return pages.find((page) => page.id === state.selectedPageId) || null;
}

function getPageById(pageId) {
  if (!pageId) return null;
  const pages = flattenPages();
  return pages.find((page) => page.id === pageId) || null;
}

function getAutoSelectedPage(pages) {
  return (
    pages.find((page) => page.status === "processing") ||
    [...pages].reverse().find((page) => page.status === "completed") ||
    pages[0]
  );
}

function ensureSelectedPage() {
  const pages = flattenPages();
  if (!pages.length) {
    state.selectedPageId = null;
    state.compareMode = "auto";
    return;
  }

  if (state.compareMode === "manual" && pages.some((page) => page.id === state.selectedPageId)) {
    return;
  }

  const preferred = getAutoSelectedPage(pages);
  state.selectedPageId = preferred?.id || null;
}

function setBusy(isBusy) {
  state.isBusy = isBusy;
  els.processBtn.disabled = isBusy || !state.session || state.session.status === "processing";
  if (els.historyClearBtn) {
    els.historyClearBtn.disabled = isBusy || !(state.historyItems || []).length;
  }
  if (els.settingsWebhookUrl) {
    els.settingsWebhookUrl.disabled = isBusy;
  }
  if (els.settingsWebhookMethod) {
    els.settingsWebhookMethod.disabled = isBusy;
  }
  if (els.settingsWebhookBody) {
    els.settingsWebhookBody.disabled = isBusy;
  }
}

function renderSettingsControls() {
  const isAdmin = currentUserIsAdmin();
  if (els.settingsWebhookSection) {
    els.settingsWebhookSection.hidden = !isAdmin;
  }
  if (els.googleLoginSettingsCard) {
    els.googleLoginSettingsCard.hidden = !isAdmin;
  }
  document.querySelectorAll("[data-theme-option]").forEach((button) => {
    button.classList.toggle("active", button.dataset.themeOption === state.theme);
  });
  document.querySelectorAll("[data-language-option]").forEach((button) => {
    button.classList.toggle("active", button.dataset.languageOption === state.language);
  });
  els.settingsThemeValue.textContent = t(state.theme === "dark" ? "theme_dark" : "theme_light");
  els.settingsLanguageValue.textContent = t(state.language === "th" ? "language_th" : "language_en");
  if (els.settingsWebhookUrl) {
    els.settingsWebhookUrl.value = state.webhookSettings?.url || "";
    els.settingsWebhookUrl.disabled = state.isBusy || !isAdmin;
  }
  if (els.settingsWebhookMethod) {
    els.settingsWebhookMethod.value = normalizeWebhookMethod(state.webhookSettings?.method);
    els.settingsWebhookMethod.disabled = state.isBusy || !isAdmin;
  }
  if (els.settingsWebhookBody) {
    els.settingsWebhookBody.value = state.webhookSettings?.body || "";
    els.settingsWebhookBody.disabled = state.isBusy || !isAdmin;
  }
}

function localizePhaseLabel(value) {
  if (!value) return t("detail_waiting");
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "waiting") return t("detail_waiting");
  if (normalized === "processing") return t("detail_processing");
  if (normalized === "queued") return t("status_queued");
  return String(value);
}

function clampModalZoom(value) {
  return Math.min(MAX_MODAL_ZOOM, Math.max(MIN_MODAL_ZOOM, value));
}

function isModalPannable() {
  return (
    els.imageModalBody.scrollWidth > els.imageModalBody.clientWidth + 1 ||
    els.imageModalBody.scrollHeight > els.imageModalBody.clientHeight + 1
  );
}

function updateModalPanState() {
  const pannable = !els.imageModal.hidden && isModalPannable();
  els.imageModalBody.classList.toggle("is-pannable", pannable);
  if (!pannable) {
    els.imageModalBody.classList.remove("is-dragging");
    state.modalIsDragging = false;
  }
}

function centerModalViewport() {
  window.requestAnimationFrame(() => {
    if (els.imageModal.hidden) return;
    els.imageModalBody.scrollLeft = Math.max((els.imageModalBody.scrollWidth - els.imageModalBody.clientWidth) / 2, 0);
    els.imageModalBody.scrollTop = Math.max((els.imageModalBody.scrollHeight - els.imageModalBody.clientHeight) / 2, 0);
    updateModalPanState();
  });
}

function applyModalZoom() {
  const hasBaseSize = state.modalBaseWidth > 0 && state.modalBaseHeight > 0;
  els.imageModalZoomDisplay.textContent = `${Math.round(state.modalZoom * 100)}%`;
  els.imageModalZoomOut.disabled = !hasBaseSize || state.modalZoom <= MIN_MODAL_ZOOM;
  els.imageModalZoomIn.disabled = !hasBaseSize || state.modalZoom >= MAX_MODAL_ZOOM;
  if (!hasBaseSize) return;

  els.imageModalStage.style.width = `${Math.round(state.modalBaseWidth * state.modalZoom)}px`;
  els.imageModalStage.style.height = `${Math.round(state.modalBaseHeight * state.modalZoom)}px`;
  updateModalPanState();
}

function syncModalBaseSize() {
  if (els.imageModal.hidden || !els.imageModalImg.naturalWidth || !els.imageModalImg.naturalHeight) {
    return;
  }

  const bodyStyles = window.getComputedStyle(els.imageModalBody);
  const bodyWidth =
    els.imageModalBody.clientWidth -
    parseFloat(bodyStyles.paddingLeft) -
    parseFloat(bodyStyles.paddingRight);
  const bodyHeight =
    els.imageModalBody.clientHeight -
    parseFloat(bodyStyles.paddingTop) -
    parseFloat(bodyStyles.paddingBottom);

  if (bodyWidth <= 0 || bodyHeight <= 0) return;

  const fitScale = Math.min(
    bodyWidth / els.imageModalImg.naturalWidth,
    bodyHeight / els.imageModalImg.naturalHeight,
    1,
  );

  state.modalBaseWidth = els.imageModalImg.naturalWidth * fitScale;
  state.modalBaseHeight = els.imageModalImg.naturalHeight * fitScale;
  applyModalZoom();
  centerModalViewport();
}

function resetModalZoom() {
  state.modalZoom = 1;
  applyModalZoom();
  centerModalViewport();
}

function adjustModalZoom(delta) {
  const nextZoom = clampModalZoom(Number((state.modalZoom + delta).toFixed(2)));
  if (nextZoom === state.modalZoom) return;
  state.modalZoom = nextZoom;
  applyModalZoom();
}

function closeImageModal() {
  state.modalPageId = null;
  state.modalExternal = null;
  state.modalZoom = 1;
  state.modalBaseWidth = 0;
  state.modalBaseHeight = 0;
  state.modalIsDragging = false;
  els.imageModal.hidden = true;
  els.imageModalImg.src = "";
  els.imageModalImg.alt = "";
  els.imageModalStage.style.width = "";
  els.imageModalStage.style.height = "";
  els.imageModalBody.scrollTop = 0;
  els.imageModalBody.scrollLeft = 0;
  els.imageModalBody.classList.remove("is-pannable", "is-dragging");
  applyModalZoom();
  document.body.style.overflow = "";
}

function closeJsonModal() {
  state.jsonModalPageId = null;
  state.jsonModalExternal = null;
  els.jsonModal.hidden = true;
  els.jsonModalTable.className = "json-modal-table empty-state";
  els.jsonModalTable.innerHTML = `<p>${escapeHtml(t("json_empty"))}</p>`;
  els.jsonModalRaw.textContent = "{}";
  document.body.style.overflow = "";
}

function openImageModal(pageId, kind) {
  const page = getPageById(pageId);
  if (!page) return;

  const imageUrl = kind === "original" ? page.originalUrl : page.processedUrl;
  if (!imageUrl) return;

  state.modalPageId = pageId;
  state.modalKind = kind;
  state.modalExternal = null;
  state.modalZoom = 1;
  state.modalBaseWidth = 0;
  state.modalBaseHeight = 0;
  els.imageModalKicker.textContent = kind === "original" ? t("modal_kicker_original") : t("modal_kicker_processed");
  els.imageModalTitle.textContent = formatPageTitle(page.fileName, page.pageNumber);
  els.imageModalImg.src = imageUrl;
  els.imageModalImg.alt = `${kind} preview for ${page.fileName} page ${page.pageNumber}`;
  els.imageModal.hidden = false;
  els.imageModalBody.scrollTop = 0;
  els.imageModalBody.scrollLeft = 0;
  applyModalZoom();
  document.body.style.overflow = "hidden";
}

function openExternalImageModal(imageUrl, title, kicker = "", alt = "History preview") {
  if (!imageUrl) return;

  state.modalPageId = null;
  state.modalExternal = {
    url: imageUrl,
    title: title || t("modal_kicker_preview"),
    kicker: kicker || t("modal_kicker_preview"),
    alt,
  };
  state.modalZoom = 1;
  state.modalBaseWidth = 0;
  state.modalBaseHeight = 0;
  els.imageModalKicker.textContent = kicker || t("modal_kicker_preview");
  els.imageModalTitle.textContent = title || t("modal_kicker_preview");
  els.imageModalImg.src = imageUrl;
  els.imageModalImg.alt = alt;
  els.imageModal.hidden = false;
  els.imageModalBody.scrollTop = 0;
  els.imageModalBody.scrollLeft = 0;
  applyModalZoom();
  document.body.style.overflow = "hidden";
}

function startModalDrag(event) {
  if (els.imageModal.hidden || !isModalPannable()) return;
  if (event.button !== 0) return;

  state.modalIsDragging = true;
  state.modalDragStartX = event.clientX;
  state.modalDragStartY = event.clientY;
  state.modalDragScrollLeft = els.imageModalBody.scrollLeft;
  state.modalDragScrollTop = els.imageModalBody.scrollTop;
  els.imageModalBody.classList.add("is-dragging");
  event.preventDefault();
}

function moveModalDrag(event) {
  if (!state.modalIsDragging) return;

  const deltaX = event.clientX - state.modalDragStartX;
  const deltaY = event.clientY - state.modalDragStartY;
  els.imageModalBody.scrollLeft = state.modalDragScrollLeft - deltaX;
  els.imageModalBody.scrollTop = state.modalDragScrollTop - deltaY;
}

function endModalDrag() {
  if (!state.modalIsDragging) return;
  state.modalIsDragging = false;
  els.imageModalBody.classList.remove("is-dragging");
}

function formatJsonValue(value) {
  if (value === null) return "<code>null</code>";
  if (value === undefined) return "<code>undefined</code>";
  if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
    return `<code>${escapeHtml(JSON.stringify(value))}</code>`;
  }
  return escapeHtml(String(value));
}

function jsonValueType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function flattenJsonRows(value, prefix = "") {
  if (Array.isArray(value)) {
    if (!value.length) {
      return [{
        field: prefix || "value",
        type: "array",
        value: "[]",
      }];
    }

    return value.flatMap((item, index) => {
      const nextPrefix = prefix ? `${prefix}[${index}]` : `[${index}]`;
      return flattenJsonRows(item, nextPrefix);
    });
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (!entries.length) {
      return [{
        field: prefix || "value",
        type: "object",
        value: "{}",
      }];
    }

    return entries.flatMap(([key, entryValue]) => {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      return flattenJsonRows(entryValue, nextPrefix);
    });
  }

  return [{
    field: prefix || "value",
    type: jsonValueType(value),
    value,
  }];
}

function renderJsonTable(value) {
  const rows = flattenJsonRows(value);
  return `
    <table class="json-kv-table">
      <thead>
        <tr>
          <th>${escapeHtml(t("json_field"))}</th>
          <th>${escapeHtml(t("json_value"))}</th>
          <th>${escapeHtml(t("json_type"))}</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((row) => `
          <tr>
            <td><code>${escapeHtml(String(row.field))}</code></td>
            <td>${formatJsonValue(row.value)}</td>
            <td><span class="json-type-badge">${escapeHtml(String(row.type))}</span></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function openJsonModal(pageId) {
  const page = getPageById(pageId);
  if (!page) return;

  const hasJson = page.webhookResponseJson !== null && page.webhookResponseJson !== undefined;
  const rawValue = page.webhookResponseRaw || "";
  if (!hasJson && !rawValue) return;

  state.jsonModalPageId = pageId;
  state.jsonModalExternal = null;
  els.jsonModalKicker.textContent = t("modal_kicker_json");
  els.jsonModalTitle.textContent = formatPageTitle(page.fileName, page.pageNumber);

  if (hasJson) {
    els.jsonModalTable.className = "json-modal-table";
    els.jsonModalTable.innerHTML = renderJsonTable(page.webhookResponseJson);
    els.jsonModalRaw.textContent = JSON.stringify(page.webhookResponseJson, null, 2);
  } else {
    els.jsonModalTable.className = "json-modal-table empty-state";
    els.jsonModalTable.innerHTML = `<p>${escapeHtml(t("json_invalid"))}</p>`;
    els.jsonModalRaw.textContent = rawValue;
  }

  els.jsonModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function openExternalJsonModal(payload, title, kicker = "") {
  const hasJson = payload !== null && payload !== undefined;
  const rawValue = typeof payload === "string" ? payload : hasJson ? JSON.stringify(payload, null, 2) : "";
  if (!hasJson && !rawValue) return;

  state.jsonModalPageId = null;
  state.jsonModalExternal = {
    title,
    kicker: kicker || t("modal_kicker_json"),
    payload: typeof payload === "string" ? null : payload,
    raw: rawValue,
  };
  els.jsonModalKicker.textContent = state.jsonModalExternal.kicker;
  els.jsonModalTitle.textContent = title || t("modal_json_default_title");

  if (state.jsonModalExternal.payload !== null) {
    els.jsonModalTable.className = "json-modal-table";
    els.jsonModalTable.innerHTML = renderJsonTable(state.jsonModalExternal.payload);
    els.jsonModalRaw.textContent = state.jsonModalExternal.raw;
  } else {
    els.jsonModalTable.className = "json-modal-table empty-state";
    els.jsonModalTable.innerHTML = `<p>${escapeHtml(t("json_invalid"))}</p>`;
    els.jsonModalRaw.textContent = state.jsonModalExternal.raw;
  }

  els.jsonModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function syncModalImage() {
  if (els.imageModal.hidden) return;
  if (state.modalExternal) return;

  const page = getPageById(state.modalPageId);
  if (!page) {
    closeImageModal();
    return;
  }

  const imageUrl = state.modalKind === "original" ? page.originalUrl : page.processedUrl;
  if (!imageUrl) {
    closeImageModal();
    return;
  }

  els.imageModalKicker.textContent = state.modalKind === "original" ? t("modal_kicker_original") : t("modal_kicker_processed");
  els.imageModalTitle.textContent = formatPageTitle(page.fileName, page.pageNumber);
  els.imageModalImg.src = imageUrl;
  els.imageModalImg.alt = `${state.modalKind} preview for ${page.fileName} page ${page.pageNumber}`;
}

function syncJsonModal() {
  if (els.jsonModal.hidden) return;
  if (state.jsonModalExternal) return;
  const page = getPageById(state.jsonModalPageId);
  if (!page) {
    closeJsonModal();
    return;
  }

  const hasJson = page.webhookResponseJson !== null && page.webhookResponseJson !== undefined;
  const rawValue = page.webhookResponseRaw || "";
  els.jsonModalTitle.textContent = formatPageTitle(page.fileName, page.pageNumber);

  if (hasJson) {
    els.jsonModalTable.className = "json-modal-table";
    els.jsonModalTable.innerHTML = renderJsonTable(page.webhookResponseJson);
    els.jsonModalRaw.textContent = JSON.stringify(page.webhookResponseJson, null, 2);
  } else if (rawValue) {
    els.jsonModalTable.className = "json-modal-table empty-state";
    els.jsonModalTable.innerHTML = `<p>${escapeHtml(t("json_invalid"))}</p>`;
    els.jsonModalRaw.textContent = rawValue;
  } else {
    closeJsonModal();
  }
}

async function api(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    let message = "Request failed.";
    try {
      const payload = await response.json();
      message = payload.detail || message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json") ? response.json() : response;
}

async function refreshCurrentUser() {
  const wasAdmin = currentUserIsAdmin();
  try {
    const payload = await api("/api/auth/me");
    setCurrentUser(payload.user || null);
  } catch (error) {
    console.error(error);
    setCurrentUser(null);
  }
  renderCurrentUser();
  renderProfile();
  renderSettingsControls();
  if (currentUserIsAdmin()) {
    if (!wasAdmin || !state.googleLoginSettings) {
      void loadGoogleLoginSettings();
    }
  }
}

async function loginOnServer(email, name = "", source = "email", password = "", googleAccessToken = "") {
  const payload = await api("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      name,
      source,
      password,
      googleAccessToken,
    }),
  });
  setCurrentUser(payload.user || null);
  renderCurrentUser();
  renderProfile();
  renderSettingsControls();
  if (currentUserIsAdmin()) {
    void loadGoogleLoginSettings();
  }
  return payload.user || null;
}

async function cleanupGuestState() {
  if (readCurrentUser().email) return;
  try {
    navigator.sendBeacon("/api/auth/guest-exit");
  } catch {
    // ignore browser cleanup failures
  }
}

async function refreshHistory() {
  try {
    const payload = await api("/api/history");
    state.historyItems = payload.items || [];
    renderHistory();
  } catch (error) {
    console.error(error);
  }
}

function startPolling() {
  stopPolling();
  if (!state.session) return;

  state.poller = window.setInterval(async () => {
    try {
      const session = await api(`/api/jobs/${state.session.sessionId}`);
      setSession(session);
      ensureSelectedPage();
      render();

      if (session.status !== "processing") {
        stopPolling();
        refreshHistory();
      }
    } catch (error) {
      stopPolling();
      console.error(error);
    }
  }, 2000);
}

function stopPolling() {
  if (state.poller) {
    window.clearInterval(state.poller);
    state.poller = null;
  }
}

async function handleUpload(fileList) {
  if (state.session?.status === "processing") {
    window.alert(t("alert_wait_processing_before_add"));
    return;
  }

  const files = Array.from(fileList || []).filter((file) => isSupportedUploadFile(file));
  if (!files.length) {
    window.alert(t("alert_choose_pdf"));
    return;
  }

  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  setBusy(true);
  try {
    const targetUrl = canAppendToCurrentSession()
      ? `/api/upload/${state.session.sessionId}`
      : "/api/upload";
    const session = await api(targetUrl, {
      method: "POST",
      body: formData,
    });
    setSession(session);
    state.selectedPageId = null;
    state.compareMode = "auto";
    ensureSelectedPage();
    render();
    refreshHistory();
  } catch (error) {
    window.alert(error.message);
  } finally {
    setBusy(false);
    els.input.value = "";
  }
}

async function handleProcess() {
  if (!state.session) {
    window.alert(t("alert_upload_before_process"));
    return;
  }

  const webhookPayload = getWebhookSettingsPayload();
  if (webhookPayload.body.trim()) {
    try {
      const parsedBody = JSON.parse(webhookPayload.body);
      if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
        throw new Error("Webhook body must be an object.");
      }
    } catch {
      window.alert(t("alert_invalid_webhook_body"));
      return;
    }
  }

  setBusy(true);
  try {
    const session = await api(`/api/process/${state.session.sessionId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        webhook: webhookPayload,
      }),
    });
    setSession(session);
    state.compareMode = "auto";
    render();
    startPolling();
    refreshHistory();
  } catch (error) {
    window.alert(error.message);
  } finally {
    setBusy(false);
  }
}

function resetWorkspace() {
  if (state.session?.status === "processing") {
    window.alert(t("alert_processing_still_running"));
    return;
  }

  stopPolling();
  setSession(null);
  state.selectedPageId = null;
  state.compareMode = "auto";
  render();
  refreshHistory();
}

async function restoreSessionFromStorage() {
  const sessionId = getActiveSessionId();
  if (!sessionId) return;

  try {
    const session = await api(`/api/jobs/${sessionId}`);
    setSession(session);
    ensureSelectedPage();
    render();
    refreshHistory();
    if (session.status === "processing") {
      startPolling();
    }
  } catch (error) {
    saveActiveSessionId("");
    console.error(error);
  }
}

function renderMetrics() {
  const session = state.session;
  const status = session ? session.status : "idle";
  els.metricPages.textContent = session ? String(session.totalPages) : "0";
  els.metricCompleted.textContent = session ? String(session.completedPages) : "0";
  els.metricStatus.textContent = formatStatus(status);
  els.metricStatusCard.dataset.status = status;
  els.metricStatus.dataset.status = status;
  if (els.metricStatusIcon) {
    const iconFile = STATUS_ICON_BY_STATE[status] || STATUS_ICON_BY_STATE.idle;
    els.metricStatusIcon.src = `/asset/${encodeURIComponent(iconFile)}`;
    els.metricStatusIcon.alt = `${formatStatus(status)} icon`;
  }

  let detail = t("metric_waiting_for_upload");
  if (session?.status === "uploaded") detail = t("metric_ready_to_start");
  if (session?.status === "processing") {
    const overallProgress = session.files?.length
      ? session.files.reduce((total, file) => total + Number(file.progress || 0), 0) / session.files.length
      : 0;
    detail = t("metric_overall_progress", {
      completed: session.completedPages,
      total: session.totalPages,
      progress: formatPercent(overallProgress),
    });
  }
  if (session?.status === "completed") detail = t("metric_processed_ready");
  if (session?.status === "failed") detail = t("metric_failed");
  if (session?.status === "processing" && session?.webhookStatus === "sending") detail = t("metric_sending_n8n");
  if (session?.webhookStatus === "completed") detail = t("metric_sent_n8n");
  if (session?.webhookStatus === "failed") detail = t("metric_send_failed");
  els.metricStatusDetail.textContent = detail;

  if (session) {
    els.uploadHint.textContent = t("upload_hint_queue", { count: session.files.length });
  } else {
    els.uploadHint.textContent = t("upload_hint_empty");
  }
}

function renderFiles() {
  if (!state.session?.files.length) {
    els.fileList.className = "file-list empty-state";
    els.fileList.innerHTML = `<p>${escapeHtml(t("queue_empty"))}</p>`;
    els.queueSummary.textContent = t("queue_summary", { count: 0 });
    return;
  }

  els.queueSummary.textContent = t("queue_summary", { count: state.session.files.length });
  els.fileList.className = "file-list";
  els.fileList.innerHTML = state.session.files
    .map((file, index) => {
      const completed = file.pageItems.filter((page) => page.status === "completed").length;
      const processingPage = file.pageItems.find((page) => page.status === "processing");
      const pendingPage = file.pageItems.find((page) => page.status === "waiting" || page.status === "failed");
      const activePage = processingPage || pendingPage || file.pageItems[file.pageItems.length - 1] || null;
      const progressValue = Number(file.progress || 0);
      const progressLabel = formatPercent(progressValue);
      const phaseLabel = processingPage
        ? t("queue_phase_current", {
          page: processingPage.pageNumber,
          total: file.pages,
          phase: localizePhaseLabel(processingPage.detailPhase || t("detail_processing")),
          progress: formatPercent(processingPage.progress || 0),
        })
        : completed === file.pages && file.pages > 0
          ? t("queue_phase_all_done")
          : activePage
            ? t("queue_phase_next", {
              page: activePage.pageNumber,
              total: file.pages,
              phase: localizePhaseLabel(activePage.detailPhase || t("detail_waiting")),
            })
            : t("queue_phase_queued");
      const removeButton = state.session.status === "processing"
        ? `<button type="button" class="queue-remove-btn" disabled>${escapeHtml(t("queue_remove"))}</button>`
        : `<button type="button" data-file-id="${file.id}" class="queue-remove-btn">${escapeHtml(t("queue_remove"))}</button>`;
      return `
        <div class="file-item">
          <div class="file-row">
            <div class="file-meta">
              <strong class="queue-file-name" title="${escapeHtml(file.name)}">${escapeHtml(truncateFilename(file.name, 72))}</strong>
              <div class="meta-mini">${escapeHtml(t("queue_meta", {
                size: formatBytes(file.size),
                pages: file.pages,
                done: completed,
                total: file.pages,
                progress: progressLabel,
              }))}</div>
            </div>
            <div class="queue-actions">
              ${statusBadge(file.status)}
              ${removeButton}
            </div>
          </div>
          <div class="queue-file-bar">
            <span>${escapeHtml(phaseLabel)}</span>
            <span>${escapeHtml(t("queue_file_label", { index: index + 1, progress: progressLabel }))}</span>
          </div>
          <div class="progress"><span style="width:${file.progress || 0}%"></span></div>
        </div>
      `;
    })
    .join("");

  document.querySelectorAll(".queue-remove-btn[data-file-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.session) return;

      const fileId = button.dataset.fileId;
      const confirmed = window.confirm(t("confirm_remove_file"));
      if (!confirmed) return;

      setBusy(true);
      try {
        const session = await api(`/api/files/${state.session.sessionId}/${fileId}`, {
          method: "DELETE",
        });
        setSession(session);
        ensureSelectedPage();
        render();
      } catch (error) {
        window.alert(error.message);
      } finally {
        setBusy(false);
      }
    });
  });
}

function renderCompare() {
  const page = getSelectedPage();
  if (!page) {
    els.compareView.className = "compare-view empty-state";
    els.compareView.innerHTML = `<p>${escapeHtml(t("compare_empty"))}</p>`;
    return;
  }

  els.compareView.className = "compare-view";
  els.compareView.innerHTML = `
    <div class="meta-row">
      <div>
        <strong class="compare-page-title" title="${escapeHtml(formatPageTitle(page.fileName, page.pageNumber))}">${escapeHtml(`${truncateFilename(page.fileName, 62)} | ${t("page_label", { page: page.pageNumber })}`)}</strong>
        <div class="meta-mini">${escapeHtml(localizePhaseLabel(page.detailPhase || t("detail_waiting")))}</div>
      </div>
      ${statusBadge(page.status)}
    </div>
    <div class="compare-grid">
      <div class="preview-panel">
        <span>${escapeHtml(t("compare_original_image"))}</span>
        ${page.originalUrl ? `<img src="${page.originalUrl}" alt="Original page ${page.pageNumber}">` : `<div class='empty-state'><p>${escapeHtml(t("compare_original_missing"))}</p></div>`}
      </div>
      <div class="preview-panel">
        <span>${escapeHtml(t("compare_processed_image"))}</span>
        ${page.processedUrl ? `<img src="${page.processedUrl}" alt="Processed page ${page.pageNumber}">` : `<div class='empty-state'><p>${escapeHtml(t("compare_processed_missing"))}</p></div>`}
      </div>
    </div>
    <div class="compare-meta">
      <div class="meta-block">
        <span>${escapeHtml(t("compare_ocr_confidence"))}</span>
        <strong>${Number(page.ocrConfidence || 0).toFixed(2)}</strong>
      </div>
      <div class="meta-block">
        <span>${escapeHtml(t("compare_best_candidate"))}</span>
        <strong>${escapeHtml(page.ocrCandidate || "-")}</strong>
      </div>
      <div class="meta-block">
        <span>${escapeHtml(t("compare_document_profile"))}</span>
        <strong>${escapeHtml(page.documentProfile || "-")}</strong>
      </div>
      <div class="meta-block">
        <span>${escapeHtml(t("compare_deskew_angle"))}</span>
        <strong>${Number(page.deskewAngle || 0).toFixed(2)} deg</strong>
      </div>
    </div>
  `;
}

function renderPages() {
  const pages = flattenPages();
  if (!pages.length) {
    els.pageGrid.className = "page-grid empty-state";
    els.pageGrid.innerHTML = `<p>${escapeHtml(t("output_empty"))}</p>`;
    return;
  }

  els.pageGrid.className = "page-grid";
  els.pageGrid.innerHTML = pages
    .map((page) => {
      const thumb = page.processedUrl || page.originalUrl;
      const isSelected = page.id === state.selectedPageId;
      const originalButton = page.originalUrl
        ? `<button type="button" data-page-id="${page.id}" data-kind="original" class="image-view-trigger">${actionIcon("original")}<span>${imageActionLabel("original")}</span></button>`
        : `<button type="button" disabled>${actionIcon("original")}<span>${imageActionLabel("original")}</span></button>`;
      const processedButton = page.processedUrl
        ? `<button type="button" data-page-id="${page.id}" data-kind="processed" class="image-view-trigger">${actionIcon("processed")}<span>${imageActionLabel("processed")}</span></button>`
        : `<button type="button" disabled>${actionIcon("processed")}<span>${imageActionLabel("processed")}</span></button>`;
      const jsonButton = page.webhookResponseJson !== null || page.webhookResponseRaw
        ? `<button type="button" data-page-id="${page.id}" class="json-view-trigger">${jsonActionIcon()}<span>${escapeHtml(t("button_json"))}</span></button>`
        : `<button type="button" disabled>${jsonActionIcon()}<span>${escapeHtml(t("button_json"))}</span></button>`;

      return `
        <div class="page-card${isSelected ? " is-selected" : ""}">
          <div class="page-card-head">
            <div>
              <strong>${escapeHtml(t("page_label", { page: page.pageNumber }))}</strong>
              <div class="meta-mini page-file-name" title="${escapeHtml(page.fileName)}">${escapeHtml(truncateFilename(page.fileName, 46))}</div>
            </div>
            ${statusBadge(page.status)}
          </div>
          <div class="thumb page-card-select" data-page-id="${page.id}">
            ${thumb ? `<img src="${thumb}" alt="${escapeHtml(t("page_label", { page: page.pageNumber }))}">` : `<div class="thumb-placeholder">${escapeHtml(t("status_waiting"))}</div>`}
          </div>
          <div class="page-detail">${escapeHtml(localizePhaseLabel(page.detailPhase || t("detail_waiting")))}</div>
          <div class="page-actions">
            ${originalButton}
            ${processedButton}
            ${jsonButton}
          </div>
        </div>
      `;
    })
    .join("");

  document.querySelectorAll(".page-card-select[data-page-id]").forEach((element) => {
    element.addEventListener("click", () => {
      state.selectedPageId = element.dataset.pageId;
      state.compareMode = "manual";
      renderCompare();
      els.compareView.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelectorAll(".image-view-trigger[data-page-id][data-kind]").forEach((button) => {
    button.addEventListener("click", () => {
      openImageModal(button.dataset.pageId, button.dataset.kind);
    });
  });

  document.querySelectorAll(".json-view-trigger[data-page-id]").forEach((button) => {
    button.addEventListener("click", () => {
      openJsonModal(button.dataset.pageId);
    });
  });
}

function renderPageCard(page, options = {}) {
  const thumb = page.processedUrl || page.originalUrl;
  const isSelected = options.isSelected || false;
  const selectableClass = options.selectable ? " page-card-select" : "";
  const selectableAttr = options.selectable ? ` data-page-id="${page.id}"` : "";
  const cardClass = isSelected ? " is-selected" : "";
  const originalButton = page.originalUrl
    ? `<button type="button" data-image-url="${page.originalUrl}" data-image-title="${escapeHtml(formatPageTitle(page.fileName, page.pageNumber))}" data-kind="original" class="${options.imageButtonClass || "image-view-trigger"}">${actionIcon("original")}<span>${imageActionLabel("original")}</span></button>`
    : `<button type="button" disabled>${actionIcon("original")}<span>${imageActionLabel("original")}</span></button>`;
  const processedButton = page.processedUrl
    ? `<button type="button" data-image-url="${page.processedUrl}" data-image-title="${escapeHtml(formatPageTitle(page.fileName, page.pageNumber))}" data-kind="processed" class="${options.imageButtonClass || "image-view-trigger"}">${actionIcon("processed")}<span>${imageActionLabel("processed")}</span></button>`
    : `<button type="button" disabled>${actionIcon("processed")}<span>${imageActionLabel("processed")}</span></button>`;
  const jsonPayload = page.webhookResponseJson !== null && page.webhookResponseJson !== undefined
    ? escapeHtml(JSON.stringify(page.webhookResponseJson))
    : "";
  const jsonButton = page.webhookResponseJson !== null || page.webhookResponseRaw
    ? `<button type="button" data-json='${jsonPayload}' data-raw="${escapeHtml(page.webhookResponseRaw || "")}" data-json-title="${escapeHtml(formatPageTitle(page.fileName, page.pageNumber))}" class="${options.jsonButtonClass || "json-view-trigger"}">${jsonActionIcon()}<span>${escapeHtml(t("button_json"))}</span></button>`
    : `<button type="button" disabled>${jsonActionIcon()}<span>${escapeHtml(t("button_json"))}</span></button>`;

  return `
    <div class="page-card${cardClass}">
      <div class="page-card-head">
        <div>
          <strong>${escapeHtml(t("page_label", { page: page.pageNumber }))}</strong>
          <div class="meta-mini page-file-name" title="${escapeHtml(page.fileName)}">${escapeHtml(truncateFilename(page.fileName, 46))}</div>
        </div>
        ${statusBadge(page.status)}
      </div>
      <div class="thumb${selectableClass}"${selectableAttr}>
        ${thumb ? `<img src="${thumb}" alt="${escapeHtml(t("page_label", { page: page.pageNumber }))}">` : `<div class="thumb-placeholder">${escapeHtml(t("status_waiting"))}</div>`}
      </div>
      <div class="page-detail">${escapeHtml(localizePhaseLabel(page.detailPhase || t("detail_waiting")))}</div>
      <div class="page-actions">
        ${originalButton}
        ${processedButton}
        ${jsonButton}
      </div>
    </div>
  `;
}

function renderLogs() {
  const logs = state.session?.logs || [];
  if (!logs.length) {
    els.logList.className = "log-list empty-state";
    els.logList.innerHTML = `<p>${escapeHtml(t("logs_empty"))}</p>`;
    return;
  }

  els.logList.className = "log-list";
  els.logList.innerHTML = [...logs]
    .reverse()
    .slice(0, 120)
    .map((log) => `
      <div class="log-item">
        <strong>${escapeHtml(log.message)}</strong>
        <div class="log-meta">${escapeHtml(formatStatus(log.level))} | ${new Date(log.timestamp).toLocaleString(getLocale())}</div>
      </div>
    `)
    .join("");
}

function groupHistoryPagesByFile(pages) {
  const groups = [];
  const indexByName = new Map();

  for (const page of pages || []) {
    const fileName = page.fileName || t("detail_document");
    if (!indexByName.has(fileName)) {
      indexByName.set(fileName, groups.length);
      groups.push({
        fileName,
        pages: [],
      });
    }

    groups[indexByName.get(fileName)].pages.push(page);
  }

  return groups;
}

function renderHistory() {
  const items = state.historyItems || [];
  els.historyClearBtn.disabled = state.isBusy || items.length === 0;

  if (!items.length) {
    els.historyList.className = "history-list empty-state";
    els.historyList.innerHTML = `<p>${escapeHtml(t("history_empty"))}</p>`;
    return;
  }

  els.historyList.className = "history-list";
  els.historyList.innerHTML = items
    .map((item) => {
      const historyPages = item.pages || [];
      const fileGroups = groupHistoryPagesByFile(historyPages);
      const historyGrid = fileGroups.length
        ? fileGroups.map((group) => `
            <section class="history-file-group">
              <div class="history-file-group-head">
                <strong>${escapeHtml(group.fileName)}</strong>
                <span>${escapeHtml(t("history_pages_count", { count: group.pages.length }))}</span>
              </div>
              <div class="page-grid history-page-grid">
                ${group.pages.map((page) => renderPageCard(page, {
                  selectable: false,
                  imageButtonClass: "history-image-view-trigger",
                  jsonButtonClass: "history-json-view-trigger",
                })).join("")}
              </div>
            </section>
          `).join("")
        : `<div class="history-preview-empty"><p>${escapeHtml(t("history_preview_empty"))}</p></div>`;

      return `
        <article class="history-item">
          <div class="history-head">
            <div>
              <strong>${escapeHtml((item.fileNames || []).length > 1 ? t("history_session_many", { count: item.fileNames.length }) : ((item.fileNames && item.fileNames[0]) || t("history_session_single")))}</strong>
              <div class="history-session-id">${escapeHtml(t("history_session_id", { id: item.sessionId }))}</div>
            </div>
            ${statusBadge(item.status)}
          </div>
          <div class="history-meta">
            <span>${escapeHtml(t("history_created", { value: formatDateTime(item.createdAt) }))}</span>
            <span>${escapeHtml(t("history_updated", { value: formatDateTime(item.updatedAt) }))}</span>
            <span>${escapeHtml(t("history_files", { value: String(item.fileCount || 0) }))}</span>
            <span>${escapeHtml(t("history_pages", { value: String(item.totalPages || 0) }))}</span>
            <span>${escapeHtml(t("history_processed", { value: String(item.processedPages || 0) }))}</span>
            <span>${escapeHtml(t("history_size", { value: formatBytes(item.totalSize || 0) }))}</span>
          </div>
          ${historyGrid}
          <div class="history-actions">
            <div class="history-stats">${escapeHtml((item.fileNames || []).length > 1 ? t("history_documents_many", { count: item.fileNames.length }) : t("history_documents_single"))}</div>
            <button type="button" data-history-session-id="${item.sessionId}" class="history-remove-btn">${escapeHtml(t("history_delete"))}</button>
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll(".history-remove-btn[data-history-session-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const sessionId = button.dataset.historySessionId;
      if (!sessionId) return;

      const confirmed = window.confirm(t("confirm_delete_history_item"));
      if (!confirmed) return;

      setBusy(true);
      try {
        await api(`/api/history/${sessionId}`, { method: "DELETE" });
        if (state.session?.sessionId === sessionId) {
          stopPolling();
          setSession(null);
          state.selectedPageId = null;
          state.compareMode = "auto";
          closeImageModal();
          render();
        }
        await refreshHistory();
      } catch (error) {
        window.alert(error.message);
      } finally {
        setBusy(false);
      }
    });
  });

  document.querySelectorAll(".history-image-view-trigger[data-image-url][data-image-title][data-kind]").forEach((button) => {
    button.addEventListener("click", () => {
      openExternalImageModal(
        button.dataset.imageUrl,
        button.dataset.imageTitle,
        button.dataset.kind === "original" ? t("modal_kicker_original") : t("modal_kicker_processed"),
        button.dataset.imageTitle || t("modal_kicker_preview"),
      );
    });
  });

  document.querySelectorAll(".history-json-view-trigger[data-json-title]").forEach((button) => {
    button.addEventListener("click", () => {
      const jsonPayload = button.dataset.json ? JSON.parse(button.dataset.json) : null;
      const rawPayload = button.dataset.raw || "";
      openExternalJsonModal(jsonPayload !== null ? jsonPayload : rawPayload, button.dataset.jsonTitle, t("modal_kicker_json"));
    });
  });
}

function render() {
  ensureSelectedPage();
  setActivePage(state.activePage, false);
  applyTranslations();
  renderSettingsControls();
  updateGoogleLoginStatus();
  updateGoogleLoginButtonState();
  applyRememberedGoogleIdentityToLogin();
  syncModernLoginControls();
  renderCurrentUser();
  renderProfile();
  renderMetrics();
  renderFiles();
  renderPages();
  renderCompare();
  renderHistory();
  renderLogs();
  syncModalImage();
  syncJsonModal();
  els.processBtn.disabled = !state.session || state.session.status === "processing" || state.isBusy;
  els.historyClearBtn.disabled = state.isBusy || !(state.historyItems || []).length;
}

els.cancelBtn.addEventListener("click", resetWorkspace);
els.processBtn.addEventListener("click", handleProcess);
els.input.addEventListener("change", (event) => handleUpload(event.target.files));

["dragenter", "dragover"].forEach((eventName) => {
  els.dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    els.dropzone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  els.dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    els.dropzone.classList.remove("dragover");
  });
});

els.dropzone.addEventListener("drop", (event) => {
  handleUpload(event.dataTransfer.files);
});

document.querySelectorAll("[data-theme-option]").forEach((button) => {
  button.addEventListener("click", () => {
    setTheme(button.dataset.themeOption);
    renderSettingsControls();
  });
});

document.querySelectorAll("[data-language-option]").forEach((button) => {
  button.addEventListener("click", () => {
    setLanguage(button.dataset.languageOption);
    render();
  });
});

[
  els.googleLoginEnabled,
  els.googleClientId,
  els.googleClientSecret,
  els.googleJavaScriptOrigin,
  els.googleRedirectUri,
  els.googleLoginUrl,
  els.googleLoginSuccessUrl,
  els.adminEmailList,
].forEach((element) => {
  if (!element) return;
  element.addEventListener("input", () => {
    updateGoogleLoginStatus();
  });
  element.addEventListener("change", () => {
    updateGoogleLoginStatus();
  });
});

if (els.googleSecretToggle) {
  els.googleSecretToggle.addEventListener("click", toggleClientSecretVisibility);
}
if (els.saveGoogleSettingsBtn) {
  els.saveGoogleSettingsBtn.addEventListener("click", () => {
    void saveGoogleLoginSettings().catch((error) => {
      showInlineMessage(els.googleSettingsFeedback, error.message, "info");
    });
  });
}
if (els.testGoogleLoginBtn) {
  els.testGoogleLoginBtn.addEventListener("click", testGoogleLoginUrl);
}
if (els.copyRedirectUriBtn) {
  els.copyRedirectUriBtn.addEventListener("click", () => {
    copyRedirectUri().catch((error) => window.alert(error.message));
  });
}
if (els.copyJavaScriptOriginBtn) {
  els.copyJavaScriptOriginBtn.addEventListener("click", () => {
    copyJavaScriptOrigin().catch((error) => window.alert(error.message));
  });
}
if (els.loginDemoBtn) {
  els.loginDemoBtn.addEventListener("click", () => {
    void handleDemoLogin().catch((error) => {
      window.alert(error.message);
    });
  });
}
if (els.loginDemoBtnModern) {
  els.loginDemoBtnModern.addEventListener("click", () => {
    void handleDemoLogin().catch((error) => {
      window.alert(error.message);
    });
  });
}
if (els.loginPrimaryBtn) {
  els.loginPrimaryBtn.addEventListener("click", () => {
    void handleDemoLogin().catch((error) => {
      window.alert(error.message);
    });
  });
}
if (els.loginGoogleBtn) {
  els.loginGoogleBtn.addEventListener("click", handleGoogleSignIn);
}
if (els.loginGoogleBtnModern) {
  els.loginGoogleBtnModern.addEventListener("click", handleGoogleSignIn);
}

[els.settingsWebhookUrl, els.settingsWebhookMethod, els.settingsWebhookBody].forEach((element) => {
  if (!element) return;
  element.addEventListener("input", () => {
    setWebhookSettings({
      url: els.settingsWebhookUrl?.value || "",
      method: els.settingsWebhookMethod?.value || DEFAULT_WEBHOOK_SETTINGS.method,
      body: els.settingsWebhookBody?.value || "",
    });
  });
});

els.imageModalBackdrop.addEventListener("click", closeImageModal);
els.imageModalClose.addEventListener("click", closeImageModal);
els.imageModalZoomOut.addEventListener("click", () => adjustModalZoom(-MODAL_ZOOM_STEP));
els.imageModalZoomIn.addEventListener("click", () => adjustModalZoom(MODAL_ZOOM_STEP));
els.imageModalZoomReset.addEventListener("click", resetModalZoom);
els.imageModalImg.addEventListener("load", syncModalBaseSize);
els.imageModalImg.draggable = false;
els.imageModalBody.addEventListener("wheel", (event) => {
  if (els.imageModal.hidden || !event.ctrlKey) return;
  event.preventDefault();
  adjustModalZoom(event.deltaY < 0 ? MODAL_ZOOM_STEP : -MODAL_ZOOM_STEP);
}, { passive: false });
els.imageModalBody.addEventListener("mousedown", startModalDrag);
window.addEventListener("mousemove", moveModalDrag);
window.addEventListener("mouseup", endModalDrag);
window.addEventListener("resize", () => {
  if (!els.imageModal.hidden) {
    syncModalBaseSize();
  }
});
els.jsonModalBackdrop.addEventListener("click", closeJsonModal);
els.jsonModalDownload.addEventListener("click", downloadJsonModalPayload);
els.jsonModalClose.addEventListener("click", closeJsonModal);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !els.imageModal.hidden) {
    closeImageModal();
  }
  if (event.key === "Escape" && !els.jsonModal.hidden) {
    closeJsonModal();
  }
});

els.historyClearBtn.addEventListener("click", async () => {
  if (!state.historyItems.length) return;

  const confirmed = window.confirm(t("confirm_delete_all_history"));
  if (!confirmed) return;

  setBusy(true);
  try {
    await api("/api/history", { method: "DELETE" });
    stopPolling();
    setSession(null);
    state.selectedPageId = null;
    state.compareMode = "auto";
    closeImageModal();
    render();
    await refreshHistory();
  } catch (error) {
    window.alert(error.message);
  } finally {
    setBusy(false);
  }
});

document.querySelectorAll(".nav-item[data-page]").forEach((button) => {
  button.addEventListener("click", () => {
    setActivePage(button.dataset.page);
  });
});

if (els.sidebarUserCard) {
  els.sidebarUserCard.addEventListener("click", handleSidebarUserCardActivate);
  els.sidebarUserCard.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSidebarUserCardActivate();
    }
  });
}

if (els.profileLoginBtn) {
  els.profileLoginBtn.addEventListener("click", () => {
    setActivePage("login");
  });
}

if (els.profileLogoutBtn) {
  els.profileLogoutBtn.addEventListener("click", () => {
    void handleLogout().catch((error) => {
      window.alert(error.message);
    });
  });
}

window.addEventListener("hashchange", () => {
  setActivePage(getPageFromLocation(), false);
  if (getRawHashName() === "login-google") {
    void loadGoogleLoginSettings().then(() => {
      maybeAutoLaunchGoogleLogin();
    });
    return;
  }
  maybeAutoLaunchGoogleLogin();
});

window.addEventListener("pagehide", () => {
  void cleanupGuestState();
});

initializePreferences();
void refreshCurrentUser();
void loadGoogleLoginSettings();
setActivePage(getPageFromLocation(), false);
render();
restoreSessionFromStorage();
void refreshHistory();
if (getRawHashName() === "login-google") {
  void loadGoogleLoginSettings().then(() => {
    maybeAutoLaunchGoogleLogin();
  });
} else {
  maybeAutoLaunchGoogleLogin();
}


