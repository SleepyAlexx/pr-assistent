if (process.env.NODE_ENV !== "production") require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  REST,
  Routes,
  SlashCommandBuilder,
  UserSelectMenuBuilder,
  StringSelectMenuBuilder,
  ChannelType,
} = require("discord.js");

const { Pool } = require("pg");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const DATABASE_URL = process.env.DATABASE_URL;

console.log("🚀 Start-Debug: index.js wurde geladen.");
console.log("🔎 Env-Check:", {
  hasToken: Boolean(TOKEN),
  hasClientId: Boolean(CLIENT_ID),
  guildId: GUILD_ID || null,
  hasDatabaseUrl: Boolean(DATABASE_URL),
  nodeEnv: process.env.NODE_ENV || null,
});

const MANAGER_ROLE_ID = "1512314173936238659";
const EMPLOYEE_ROLE_ID = "1512314173936238653";
const PROBE_ROLE_ID = "1512314173936238652";
const DUTY_ROLE_ID = "1512314173936238655";
const PERSONAL_MANAGER_ROLE_ID = "1512314173936238660";

const OWNER_ROLE_ID = "1512314174045294605";
const CO_OWNER_ROLE_ID = "1512314174045294604";
const HIGH_COMMAND_ROLE_ID = "1512314174045294603";

const FULL_ACCESS_ROLE_IDS = [
  "1512314174045294607",
  "1512314174045294608",
];

const WARNING_ROLE_1_ID = "1512314173844095168";
const WARNING_ROLE_2_ID = "1512314173844095167";

const TEAMUPDATE_EMPLOYEE_ROLE_ID = "1512314173936238653";
const TEAMUPDATE_PROBE_EMPLOYEE_ROLE_ID = "1512314173936238652";
const TEAMUPDATE_EMPLOYEE_BASE_ROLE_ID = "1512314173936238656";

const TEAMUPDATE_MANAGEMENT_BASE_ROLE_ID = "1512314174045294606";
const TEAMUPDATE_PROBE_MANAGER_ROLE_ID = "1512314173936238658";
const TEAMUPDATE_MANAGER_ROLE_ID = "1512314173936238659";
const TEAMUPDATE_PERSONAL_MANAGER_ROLE_ID = "1512314173936238660";

const TEAMUPDATE_CASINO_EMPLOYEE_ROLE_ID = "1512619917915197580";
const TEAMUPDATE_CASINO_BASE_ROLE_ID = "1512619798234923058";

const REQUEST_CHANNEL_ID = "1512314177396543580";
const ABSENCE_CHANNEL_ID = "1512314177396543578";

const CLOCK_CHANNEL_ID = "1512314176884703296";
const REMINDER_CHANNEL_ID = "1512314176884703297";

const WEEKLY_WORKTIME_CHANNEL_ID = "1512314176884703298";
const TOTAL_WORKTIME_CHANNEL_ID = "1512314181259366542";

const CORRECTION_CHANNEL_ID = "1512314176884703299";
const PERSONAL_OVERVIEW_CHANNEL_ID = "1512314181259366547";
const TIME_LOG_CHANNEL_ID = "1512314180752117936";

const SHOPPING_CHANNEL_ID = "1512314177396543582";
const APPLICATION_CHANNEL_ID = "1513128952275669135";
const HOUSE_BAN_CHANNEL_ID = "1512314177396543583";

const MANAGEMENT_PANEL_CHANNEL_ID = "1512314180752117930";
const MANAGEMENT_OUTPUT_CHANNEL_ID = "1512314176486506584";
const TRAINING_OUTPUT_CHANNEL_ID = "1512314182299816046";
const WELCOME_CHANNEL_ID = "1512314177887145985";
const REGISTRATION_CHANNEL_ID = "1512314177887145986";

const DASHBOARD_CHANNEL_ID = "1512314180752117933";
const ACTIVE_STANDS_CHANNEL_ID = "1512314177396543581";
const PERSONAL_FILES_CHANNEL_ID = "1512314182299816049";
const STATISTICS_WEEKLY_CHANNEL_ID = "1512314182299816050";
const MANAGER_CHAT_CHANNEL_ID = "1512314181259366547";
const STOCK_CHECK_REMINDER_CHANNEL_ID = "1512314181259366549";
const BUSINESS_TIME_LOG_CHANNEL_ID = "1512314180752117934";
const TICKET_DEBUG_CHANNEL_ID = "1512779121170714695";

const BOOKING_REQUEST_CHANNEL_ID = "1512409329771221075";
const BOOKING_CONFIRMED_CHANNEL_ID = "1512409661029224488";

const TICKET_BUNGALOW_CHANNEL_ID = "1512762754732261386";
const TICKET_ESSENSSTAND_CHANNEL_ID = "1512762825603285193";
const TICKET_EVENT_CHANNEL_ID = "1512762866917441617";
const TICKET_GENERAL_CHANNEL_ID = "1512762899024842803";

const TICKET_CLOSE_AFTER_MS = 2 * 24 * 60 * 60 * 1000;
const TICKET_DELETE_AFTER_CLOSE_MS = 2 * 24 * 60 * 60 * 1000;

const TERMINATION_REMOVE_ROLE_IDS = [
  EMPLOYEE_ROLE_ID,
  TEAMUPDATE_EMPLOYEE_ROLE_ID,
  PROBE_ROLE_ID,
];

const REGISTRATION_ROLE_IDS = [
  "1512314173844095170",
  "1512314173844095169",
  "1512314173844095175",
];

const CITIZEN_COMMAND_BLOCK_ROLE_IDS = [
  "1512314173844095170",
  "1512314173844095175",
];

const PROBE_RANKUP_MINUTES = 600;
const REMINDER_AFTER_MS = 2 * 60 * 60 * 1000;
const REMINDER_RESPONSE_MS = 10 * 60 * 1000;
const LEADERBOARD_PAGE_SIZE = 7;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const managementDrafts = new Map();
const timeManagementDrafts = new Map();

const ticketRemovalBlocklist = new Map();

function draftKey(userId, type) {
  return `${userId}:${type}`;
}

async function query(sql, params = []) {
  return pool.query(sql, params);
}

function hasLeadershipRole(member) {
  if (!member?.roles?.cache) return false;

  return (
    member.roles.cache.has(OWNER_ROLE_ID) ||
    member.roles.cache.has(CO_OWNER_ROLE_ID) ||
    member.roles.cache.has(HIGH_COMMAND_ROLE_ID) ||
    FULL_ACCESS_ROLE_IDS.some((roleId) => member.roles.cache.has(roleId))
  );
}

function hasManagerRole(member) {
  return hasLeadershipRole(member) || member.roles.cache.has(MANAGER_ROLE_ID);
}

function isPersonalManager(member) {
  return hasLeadershipRole(member) || member.roles.cache.has(PERSONAL_MANAGER_ROLE_ID);
}

function canCreatePanels(member) {
  return hasLeadershipRole(member) || hasManagerRole(member) || isPersonalManager(member);
}

function canManagePersonal(member) {
  return hasLeadershipRole(member) || hasManagerRole(member) || isPersonalManager(member);
}

function formatMinutes(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} Stunden & ${m} Minuten`;
}

function formatShortMinutes(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} Std. ${m} Min.`;
}

function medal(index) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `**${index + 1}.**`;
}

function parseGermanDate(input) {
  const match = input.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCDate() !== day ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCFullYear() !== year
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseCorrectionTime(raw) {
  const clean = raw.trim();

  if (clean.includes(":")) {
    const [h, m] = clean.split(":").map(Number);
    if (!Number.isNaN(h) && !Number.isNaN(m) && h >= 0 && m >= 0 && m < 60) {
      return h * 60 + m;
    }
  }

  const number = Number(clean);
  if (!Number.isNaN(number) && number >= 0) return number;

  return null;
}

function formatName(raw) {
  return raw
    .trim()
    .replace(/[ ]+/g, " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getField(embed, name) {
  return embed.fields?.find((f) => f.name === name)?.value || "";
}

async function getSetting(key, fallback = null) {
  const res = await query(`SELECT value FROM bot_settings WHERE key = $1`, [key]);
  return res.rows[0]?.value ?? fallback;
}

async function setSetting(key, value) {
  await query(
    `
    INSERT INTO bot_settings (key, value)
    VALUES ($1, $2)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    `,
    [key, String(value)]
  );
}

async function ensureEmployee(userId) {
  await query(
    `
    INSERT INTO employees (user_id, total_minutes, weekly_minutes, left_server)
    VALUES ($1, 0, 0, FALSE)
    ON CONFLICT (user_id)
    DO UPDATE SET left_server = FALSE;
    `,
    [userId]
  );
}

function replaceStatusField(embed, statusText) {
  const fields = embed.fields?.map((f) => ({
    name: f.name,
    value: f.value,
    inline: f.inline,
  })) || [];

  const index = fields.findIndex((f) => f.name === "Status");

  if (index >= 0) fields[index].value = statusText;
  else fields.push({ name: "Status", value: statusText });

  return fields;
}

async function initDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS employees (
      user_id TEXT PRIMARY KEY,
      total_minutes INTEGER NOT NULL DEFAULT 0,
      weekly_minutes INTEGER NOT NULL DEFAULT 0,
      rankup_notified BOOLEAN NOT NULL DEFAULT FALSE,
      left_server BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS active_sessions (
      user_id TEXT PRIMARY KEY,
      started_at TIMESTAMPTZ NOT NULL,
      pause_started_at TIMESTAMPTZ,
      paused_ms BIGINT NOT NULL DEFAULT 0,
      reminder_message_id TEXT,
      reminder_sent_at TIMESTAMPTZ,
      reminder_deadline_at TIMESTAMPTZ
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS work_sessions (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      started_at TIMESTAMPTZ NOT NULL,
      ended_at TIMESTAMPTZ NOT NULL,
      minutes INTEGER NOT NULL,
      auto_clockout BOOLEAN NOT NULL DEFAULT FALSE,
      corrected BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS absences (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      date_from DATE NOT NULL,
      date_to DATE NOT NULL,
      reason TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS bot_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS business_user_links (
      business_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      linked_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS business_name_links (
      name_key TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      linked_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS business_time_imports (
      message_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      business_id TEXT,
      duration_minutes INTEGER NOT NULL,
      duration_text TEXT,
      raw_text TEXT,
      imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS warning_records (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      warning_role_id TEXT NOT NULL,
      issuer_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      reminded BOOLEAN NOT NULL DEFAULT FALSE,
      active BOOLEAN NOT NULL DEFAULT TRUE
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS active_stands (
      id SERIAL PRIMARY KEY,
      message_id TEXT,
      request_message_id TEXT,
      creator_id TEXT NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      time_text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      closed_at TIMESTAMPTZ
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS personal_file_notes (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      issuer_id TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS personnel_events (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      issuer_id TEXT,
      event_type TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS stock_check_logs (
      id SERIAL PRIMARY KEY,
      message_id TEXT,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS time_adjustments (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      issuer_id TEXT NOT NULL,
      action TEXT NOT NULL,
      minutes INTEGER NOT NULL,
      old_weekly_minutes INTEGER NOT NULL DEFAULT 0,
      new_weekly_minutes INTEGER NOT NULL DEFAULT 0,
      old_total_minutes INTEGER NOT NULL DEFAULT 0,
      new_total_minutes INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS ticket_records (
      id SERIAL PRIMARY KEY,
      thread_id TEXT UNIQUE NOT NULL,
      opener_id TEXT NOT NULL,
      category TEXT NOT NULL,
      claimed_by TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      base_name TEXT NOT NULL,
      current_name TEXT NOT NULL,
      close_requested_by TEXT,
      close_requested_at TIMESTAMPTZ,
      close_deadline_at TIMESTAMPTZ,
      close_message_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`ALTER TABLE ticket_records ADD COLUMN IF NOT EXISTS delete_after_at TIMESTAMPTZ;`);

  await query(`
    CREATE TABLE IF NOT EXISTS ticket_removed_members (
      thread_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      removed_by TEXT NOT NULL,
      removed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (thread_id, user_id)
    );
  `);

  console.log("✅ Datenbank bereit.");
}

async function registerCommands() {
  console.log("🔄 Slash Commands werden vorbereitet...");

  if (!TOKEN) throw new Error("DISCORD_TOKEN fehlt in den Railway Variables.");
  if (!CLIENT_ID) throw new Error("CLIENT_ID fehlt in den Railway Variables.");
  if (!GUILD_ID) throw new Error("GUILD_ID fehlt in den Railway Variables.");

  const commands = [
    new SlashCommandBuilder()
      .setName("uhr")
      .setDescription("Sendet das Stempel-Uhr Panel."),

    new SlashCommandBuilder()
      .setName("mitarbeiterpanel")
      .setDescription("Sendet das Mitarbeiterpanel."),

    new SlashCommandBuilder()
      .setName("managementpanel")
      .setDescription("Sendet das Management-Panel."),

    new SlashCommandBuilder()
      .setName("registrierungspanel")
      .setDescription("Sendet das Registrierungs-Panel."),

    new SlashCommandBuilder()
      .setName("ticketpanel")
      .setDescription("Sendet das Pearls Ticket-Panel."),

    new SlashCommandBuilder()
      .setName("ticket-add")
      .setDescription("Fügt einen User zum aktuellen Ticket hinzu.")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("User auswählen")
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("ticket-remove")
      .setDescription("Entfernt einen User aus dem aktuellen Ticket.")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("User auswählen")
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("ticket-rename")
      .setDescription("Benennt das aktuelle Ticket um.")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("Neuer Ticketname")
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("ticket-claim")
      .setDescription("Übernimmt das aktuelle Ticket."),

    new SlashCommandBuilder()
      .setName("ticket-close")
      .setDescription("Startet eine Schließungsanfrage für das aktuelle Ticket."),

    new SlashCommandBuilder()
      .setName("ticketclose")
      .setDescription("Startet eine Schließungsanfrage für das aktuelle Ticket."),

    new SlashCommandBuilder()
      .setName("ticket-open")
      .setDescription("Öffnet ein archiviertes/geschlossenes Ticket wieder.")
      .addStringOption((option) =>
        option
          .setName("thread_id")
          .setDescription("Optional: Thread-ID, wenn du den Command außerhalb des Tickets nutzt")
          .setRequired(false)
      ),

    new SlashCommandBuilder()
      .setName("ticketopen")
      .setDescription("Öffnet ein archiviertes/geschlossenes Ticket wieder.")
      .addStringOption((option) =>
        option
          .setName("thread_id")
          .setDescription("Optional: Thread-ID, wenn du den Command außerhalb des Tickets nutzt")
          .setRequired(false)
      ),

    new SlashCommandBuilder()
      .setName("dashboard")
      .setDescription("Aktualisiert das Live-Dashboard."),

    new SlashCommandBuilder()
      .setName("akte")
      .setDescription("Zeigt die Personalakte eines Mitarbeiters.")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("Mitarbeiter auswählen")
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("personalnotiz")
      .setDescription("Fügt eine interne Notiz zur Personalakte hinzu.")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("Mitarbeiter auswählen")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("notiz")
          .setDescription("Interne Notiz")
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("mitarbeitercheck")
      .setDescription("Analysiert einen Mitarbeiter automatisch.")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("Mitarbeiter auswählen")
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("business-link")
      .setDescription("Verknüpft einen Business-Namen mit einem Discord-User.")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("Discord-User auswählen")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("Name aus dem Business-System, z. B. Florian Müller")
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("business-links")
      .setDescription("Zeigt alle Business-Namen-Verknüpfungen an."),

    new SlashCommandBuilder()
      .setName("business-unlink")
      .setDescription("Löscht eine Business-Namen-Verknüpfung.")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("Name aus dem Business-System, der entfernt werden soll")
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("zeitpanel")
      .setDescription("Sendet das Zeitverwaltungs-Panel."),
  ].map((cmd) => cmd.toJSON());

  async function withTimeout(promise, ms, label) {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} hat nach ${Math.round(ms / 1000)} Sekunden nicht geantwortet.`)), ms);
    });

    try {
      return await Promise.race([promise, timeout]);
    } finally {
      clearTimeout(timer);
    }
  }

  try {
    console.log(`🔄 Slash Commands werden registriert über Guild-Client: ${commands.length} Commands für Guild ${GUILD_ID}...`);

    const guild = await withTimeout(client.guilds.fetch(GUILD_ID), 30000, "Guild-Fetch");
    await withTimeout(guild.commands.set(commands), 90000, "Guild-Command-Registrierung");

    console.log(`✅ Slash Commands registriert über Guild-Client: ${commands.length}`);
    return true;
  } catch (guildErr) {
    console.error("⚠️ Guild-Client Registrierung fehlgeschlagen. Versuche REST-Fallback...", guildErr);
  }

  try {
    console.log(`🔄 Slash Commands werden registriert über REST-Fallback: ${commands.length} Commands für Guild ${GUILD_ID}...`);

    const rest = new REST({ version: "10", timeout: 120000 }).setToken(TOKEN);
    await withTimeout(
      rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands }),
      120000,
      "REST-Command-Registrierung"
    );

    console.log(`✅ Slash Commands registriert über REST-Fallback: ${commands.length}`);
    return true;
  } catch (restErr) {
    console.error("❌ Fehler beim Registrieren der Slash Commands über beide Wege:", restErr);
    console.error("⚠️ Der Bot bleibt online, aber die Slash Commands wurden nicht aktualisiert.");
    return false;
  }
}

function clockButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("clock_in").setLabel("Einstempeln").setEmoji("🟢").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("clock_out").setLabel("Ausstempeln").setEmoji("🔴").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("pause_start").setLabel("Pause starten").setEmoji("⏸️").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("pause_end").setLabel("Pause beenden").setEmoji("▶️").setStyle(ButtonStyle.Primary)
  );
}

function leaderboardButtons(type, page, totalPages) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`${type}_prev`).setEmoji("⬅️").setStyle(ButtonStyle.Secondary).setDisabled(page <= 0),
    new ButtonBuilder().setCustomId(`${type}_next`).setEmoji("➡️").setStyle(ButtonStyle.Secondary).setDisabled(page >= totalPages - 1)
  );
}

function shoppingButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("shopping_done").setLabel("Erledigt").setEmoji("✅").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("shopping_open").setLabel("Offen").setEmoji("🕒").setStyle(ButtonStyle.Secondary)
  );
}

function applicationButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("application_accept").setLabel("Angenommen").setEmoji("✅").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("application_deny").setLabel("Abgelehnt").setEmoji("❌").setStyle(ButtonStyle.Danger)
  );
}

function houseBanButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ban_active").setLabel("Aktiv").setEmoji("🚫").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("ban_expired").setLabel("Abgelaufen").setEmoji("✅").setStyle(ButtonStyle.Success)
  );
}

function foodButtons(creatorId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`food_approve_${creatorId}`).setLabel("Bestätigen").setEmoji("✅").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`food_deny_${creatorId}`).setLabel("Ablehnen").setEmoji("❌").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`food_time_${creatorId}`).setLabel("Uhrzeit ändern").setEmoji("🕒").setStyle(ButtonStyle.Secondary)
  );
}

function timeOnlyButton(creatorId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`food_time_${creatorId}`).setLabel("Uhrzeit ändern").setEmoji("🕒").setStyle(ButtonStyle.Secondary)
  );
}

function managementPanelRows() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("mgmt_warning_start").setLabel("Verwarnung").setEmoji("⚠️").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("mgmt_teamupdate_start").setLabel("Teamupdate").setEmoji("🔄").setStyle(ButtonStyle.Success)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("mgmt_termination_start").setLabel("Kündigung").setEmoji("📤").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("mgmt_warning_remove_start").setLabel("Verwarnung zurückziehen").setEmoji("🔄").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("mgmt_training_start").setLabel("Einweisung").setEmoji("🧠").setStyle(ButtonStyle.Success)
  );

  return [row1, row2];
}

function timeManagementPanelRows() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("time_add_start").setLabel("Zeit hinzufügen").setEmoji("➕").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("time_remove_start").setLabel("Zeit entfernen").setEmoji("➖").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("time_view_start").setLabel("Zeiten ansehen").setEmoji("📊").setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("time_set_weekly_start").setLabel("Weekly setzen").setEmoji("🔄").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("time_set_total_start").setLabel("Gesamtzeit setzen").setEmoji("🏆").setStyle(ButtonStyle.Secondary)
  );

  return [row1, row2];
}

function warningRoleSelect(customId) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder("Welche Verwarnung?")
      .addOptions(
        { label: "Verwarnung 1", value: WARNING_ROLE_1_ID, description: "Erste Verwarnungsrolle" },
        { label: "Verwarnung 2", value: WARNING_ROLE_2_ID, description: "Zweite Verwarnungsrolle" }
      )
  );
}

function teamUpdateRoleSelect(customId) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder("Welche Rolle soll vergeben werden?")
      .addOptions(
        { label: "Probe Mitarbeiter", value: "probe_employee", description: "Vergibt Probe Mitarbeiter + Basisrolle" },
        { label: "Mitarbeiter", value: "employee", description: "Vergibt Mitarbeiter + Basisrolle" },
        { label: "Casino Mitarbeiter", value: "casino_employee", description: "Vergibt Casino Mitarbeiter + Casino-Basisrolle" },
        { label: "Probe Manager", value: "probe_manager", description: "Vergibt Probe Manager + Leitungsbasis" },
        { label: "Manager", value: "manager", description: "Vergibt Manager + Leitungsbasis" },
        { label: "Personal Manager", value: "personal_manager", description: "Vergibt Personal Manager + Leitungsbasis" }
      )
  );
}

function userSelect(customId, placeholder = "User auswählen") {
  return new ActionRowBuilder().addComponents(
    new UserSelectMenuBuilder().setCustomId(customId).setPlaceholder(placeholder).setMinValues(1).setMaxValues(1)
  );
}

function continueButton(customId, label = "Weiter") {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(customId).setLabel(label).setEmoji("➡️").setStyle(ButtonStyle.Primary)
  );
}

function buildFoodEmbed(data) {
  return new EmbedBuilder()
    .setColor(data.color || 0xf1c40f)
    .setTitle(`🍽️ Neue Essensstand-Anfrage ${data.requestId}`)
    .addFields(
      { name: "Essensstand", value: data.name || "Nicht angegeben" },
      { name: "Ort", value: data.location || "Nicht angegeben" },
      { name: "Uhrzeit", value: data.time || "Nicht angegeben" },
      { name: "Status", value: data.status || "⏳ Wartet auf Bestätigung" },
      { name: "Erstellt von", value: `<@${data.creatorId}>` },
      { name: "Letzte Änderung", value: data.lastChange || "Noch keine Änderung" }
    )
    .setTimestamp();
}

function bookingButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("booking_confirm").setLabel("Buchung bestätigen").setEmoji("✅").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("booking_deny").setLabel("Buchung ablehnen").setEmoji("❌").setStyle(ButtonStyle.Danger)
  );
}

function bookingPanelButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("open_bungalow_booking_modal")
      .setLabel("Bungalow buchen")
      .setEmoji("🏝️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("open_foodstand_booking_modal")
      .setLabel("Essensstand buchen")
      .setEmoji("🍽️")
      .setStyle(ButtonStyle.Success)
  );
}

function buildBookingEmbed(data) {
  const isFoodstand = data.type === "foodstand";
  const emoji = isFoodstand ? "🍽️" : "🏝️";
  const bookingName = isFoodstand ? "Essensstand-Buchung" : "Bungalow-Buchung";

  const fields = isFoodstand
    ? [
        { name: "Ansprechpartner / Name", value: data.name || "Nicht angegeben" },
        { name: "Telefonnummer", value: data.phone || "Nicht angegeben" },
        { name: "Datum & Uhrzeit", value: data.timeframe || "Nicht angegeben" },
        { name: "Personen / Gäste", value: data.people || "Nicht angegeben" },
        { name: "Ort / Event / Feier", value: data.location || "Nicht angegeben" },
        { name: "Essensstand / Wunsch / Notiz", value: data.wish || "Keine Angabe" },
        { name: "Status", value: data.status || "⏳ Wartet auf Bestätigung" },
        { name: "Eingereicht von", value: `<@${data.creatorId}>` },
        { name: "Letzte Änderung", value: data.lastChange || "Noch keine Änderung" },
      ]
    : [
        { name: "Gast / Name", value: data.name || "Nicht angegeben" },
        { name: "Telefonnummer", value: data.phone || "Nicht angegeben" },
        { name: "Zeitraum", value: data.timeframe || "Nicht angegeben" },
        { name: "Personen", value: data.people || "Nicht angegeben" },
        { name: "Bungalow / Wunsch", value: data.wish || "Keine Angabe" },
        { name: "Status", value: data.status || "⏳ Wartet auf Bestätigung" },
        { name: "Eingereicht von", value: `<@${data.creatorId}>` },
        { name: "Letzte Änderung", value: data.lastChange || "Noch keine Änderung" },
      ];

  return new EmbedBuilder()
    .setColor(data.color || (isFoodstand ? 0xf1c40f : 0x5dade2))
    .setTitle(`${emoji} Neue ${bookingName} ${data.requestId}`)
    .addFields(fields)
    .setFooter({ text: isFoodstand ? "Pearls • Essensstand-Buchungssystem" : "Pearls • Bungalow-Buchungssystem" })
    .setTimestamp();
}

const TICKET_CATEGORIES = {
  bungalow: {
    label: "Bungalow buchen",
    short: "bungalow",
    emoji: "🏝️",
    channelId: TICKET_BUNGALOW_CHANNEL_ID,
    access: "staff",
    description:
      "Für Bungalow-Anfragen, Reservierungen, Aufenthalte oder private Buchungen.",
  },
  essensstand: {
    label: "Essensstand buchen",
    short: "essensstand",
    emoji: "🍽️",
    channelId: TICKET_ESSENSSTAND_CHANNEL_ID,
    access: "management",
    description:
      "Für Essensstand-Anfragen bei Events, Feiern oder besonderen Veranstaltungen.",
  },
  event: {
    label: "Event-Anfrage",
    short: "event",
    emoji: "🎉",
    channelId: TICKET_EVENT_CHANNEL_ID,
    access: "management",
    description:
      "Für größere Veranstaltungen, Kooperationen oder geplante Events.",
  },
  allgemein: {
    label: "Allgemeine Anfrage",
    short: "allgemein",
    emoji: "❓",
    channelId: TICKET_GENERAL_CHANNEL_ID,
    access: "staff",
    description:
      "Für Fragen, Support oder sonstige Anliegen.",
  },
};

const TICKET_STAFF_ROLE_IDS = [
  "1512314174045294607",
  "1512314174045294608",
  "1512314174045294606",
  "1512314174045294605",
  "1512314174045294604",
  "1512314173936238660",
  "1512314173936238659",
  "1512314173936238658",
  "1512619798234923058",
  "1512619917915197580",
  "1512314173936238656",
  "1512314173936238653",
  "1512314173936238652",
];

const TICKET_MANAGEMENT_ROLE_IDS = [
  "1512314174045294607",
  "1512314174045294608",
  "1512314174045294606",
  "1512314174045294605",
  "1512314174045294604",
  "1512314173936238660",
  "1512314173936238659",
  "1512314173936238658",
];

const TICKET_RESTRICTED_EVENT_ROLE_IDS = [
  "1512314174045294607",
  "1512314174045294608",
  "1512314174045294605",
  "1512314174045294604",
];

const TICKET_AUTO_ADD_ROLE_IDS = [
  "1512314174045294607",
  "1512314174045294608",
  "1512314174045294606",
  "1512314174045294605",
  "1512314174045294604",
  "1512314173936238660",
  "1512314173936238659",
  "1512314173936238658",
  "1512619798234923058",
  "1512619917915197580",
  "1512314173936238656",
  "1512314173936238653",
  "1512314173936238652",
];

function ticketPanelButtons() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ticket_open_bungalow").setLabel("Bungalow buchen").setEmoji("🏝️").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("ticket_open_essensstand").setLabel("Essensstand buchen").setEmoji("🍽️").setStyle(ButtonStyle.Success)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ticket_open_event").setLabel("Event-Anfrage").setEmoji("🎉").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("ticket_open_allgemein").setLabel("Allgemeine Anfrage").setEmoji("❓").setStyle(ButtonStyle.Secondary)
  );

  return [row1, row2];
}

function ticketThreadButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ticket_claim").setLabel("Ticket übernehmen").setEmoji("📌").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("ticket_request_close").setLabel("Ticket schließen").setEmoji("🔒").setStyle(ButtonStyle.Danger)
  );
}

function ticketCloseButtons(threadId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ticket_close_confirm_${threadId}`).setLabel("Schließen").setEmoji("✅").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`ticket_close_cancel_${threadId}`).setLabel("Abbrechen").setEmoji("❌").setStyle(ButtonStyle.Secondary)
  );
}

function cleanTicketName(name) {
  return (name || "user")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 18) || "user";
}

function memberTicketName(member, user) {
  return cleanTicketName(member?.nickname || user?.globalName || user?.username || "user");
}

function categoryRoles(categoryKey) {
  // Essensstand und Event bleiben bewusst enger beschränkt.
  if (categoryKey === "essensstand" || categoryKey === "event") {
    return TICKET_RESTRICTED_EVENT_ROLE_IDS;
  }

  // Allgemeine Anfrage soll exakt wie Bungalow laufen: alle Staff-/Teamrollen dürfen rein und Commands nutzen.
  if (categoryKey === "bungalow" || categoryKey === "allgemein") {
    return TICKET_STAFF_ROLE_IDS;
  }

  const category = TICKET_CATEGORIES[categoryKey];
  return category?.access === "management" ? TICKET_MANAGEMENT_ROLE_IDS : TICKET_STAFF_ROLE_IDS;
}

function ticketAutoAddRoles(categoryKey) {
  // Essensstand und Event: nur die eingeschränkten Rollen + Full-Access-Rollen.
  if (categoryKey === "essensstand" || categoryKey === "event") {
    return TICKET_RESTRICTED_EVENT_ROLE_IDS;
  }

  // Allgemeine Anfrage lädt jetzt dieselben Rollen wie Bungalow automatisch in den privaten Thread ein.
  if (categoryKey === "bungalow" || categoryKey === "allgemein") {
    return TICKET_STAFF_ROLE_IDS;
  }

  return TICKET_AUTO_ADD_ROLE_IDS;
}

function detectTicketCategoryFromName(name = "") {
  const lower = String(name || "").toLowerCase();

  for (const [key, category] of Object.entries(TICKET_CATEGORIES)) {
    if (lower.includes(category.short.toLowerCase())) return key;
  }

  return null;
}

function formatRenamedTicketName(rawName, categoryKey) {
  const category = TICKET_CATEGORIES[categoryKey];
  const cleaned = cleanTicketName(rawName);

  if (!category) return cleaned.slice(0, 95);

  const lower = cleaned.toLowerCase();
  const suffix = `${category.emoji}-${category.short}`;

  if (lower.includes(category.short.toLowerCase())) {
    return cleaned.slice(0, 95);
  }

  return `${cleaned}-${suffix}`.slice(0, 95);
}

function memberHasAnyRole(member, roleIds) {
  if (!member?.roles?.cache) return false;
  return roleIds.some((roleId) => member.roles.cache.has(roleId));
}

function isRestrictedCitizenCommandUser(member) {
  if (!member?.roles?.cache) return false;

  const hasCitizenRole = memberHasAnyRole(member, CITIZEN_COMMAND_BLOCK_ROLE_IDS);
  if (!hasCitizenRole) return false;

  const hasTeamOrLeadershipRole = memberHasAnyRole(member, TICKET_AUTO_ADD_ROLE_IDS);
  return !hasTeamOrLeadershipRole;
}

function canUseTicketStaffCommands(member, categoryKey) {
  return memberHasAnyRole(member, categoryRoles(categoryKey));
}

async function getTicketByThread(threadId) {
  const res = await query(`SELECT * FROM ticket_records WHERE thread_id = $1`, [threadId]).catch((err) => {
    console.error("❌ Ticket-Datenbankabfrage fehlgeschlagen:", err);
    return { rows: [] };
  });

  return res.rows[0] || null;
}

async function getOrRecoverTicketFromThread(thread) {
  if (!thread?.id) return null;

  const existing = await getTicketByThread(thread.id);
  if (existing) return existing;

  const categoryKey = detectTicketCategoryFromName(thread.name);
  if (!categoryKey) return null;

  const baseName = `${TICKET_CATEGORIES[categoryKey].emoji}-${TICKET_CATEGORIES[categoryKey].short}-anfrage`;

  const inserted = await query(
    `
    INSERT INTO ticket_records (thread_id, opener_id, category, base_name, current_name)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (thread_id) DO UPDATE
    SET category = EXCLUDED.category,
        current_name = EXCLUDED.current_name,
        updated_at = NOW()
    RETURNING *;
    `,
    [thread.id, thread.ownerId || "unknown", categoryKey, baseName, thread.name]
  ).catch((err) => {
    console.error("❌ Ticket-Recovery fehlgeschlagen:", err);
    return { rows: [] };
  });

  return inserted.rows[0] || null;
}

async function getTicketFromCloseToken(token) {
  const clean = String(token || "");

  let res = await query(`SELECT * FROM ticket_records WHERE thread_id = $1`, [clean]).catch(() => ({ rows: [] }));
  if (res.rows[0]) return res.rows[0];

  if (/^\d+$/.test(clean)) {
    res = await query(`SELECT * FROM ticket_records WHERE id = $1`, [Number(clean)]).catch(() => ({ rows: [] }));
    if (res.rows[0]) return res.rows[0];
  }

  return null;
}

function disableActionRows(rows = []) {
  try {
    return rows.map((row) => {
      const newRow = ActionRowBuilder.from(row);
      newRow.components.forEach((component) => {
        if (typeof component.setDisabled === "function") component.setDisabled(true);
      });
      return newRow;
    });
  } catch (err) {
    console.error("⚠️ Ticket-Buttons konnten nicht deaktiviert werden:", err?.message || err);
    return [];
  }
}

function stripTicketStatusPrefixes(name) {
  let clean = String(name || "ticket").trim();

  for (let i = 0; i < 10; i++) {
    const next = clean.replace(/^(closing|closed)-+/i, "");
    if (next === clean) break;
    clean = next;
  }

  clean = clean
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 95);

  return clean || "ticket";
}

function getRestoreTicketName(ticket) {
  const raw = ticket?.current_name || ticket?.base_name || "ticket";
  return stripTicketStatusPrefixes(raw);
}

function getOpenTicketName(ticket, thread = null, fallbackName = null) {
  const options = [
    fallbackName,
    ticket?.current_name,
    thread?.name,
    ticket?.base_name,
    "ticket",
  ];

  for (const option of options) {
    const clean = stripTicketStatusPrefixes(option);
    if (clean && clean !== "ticket") return clean.slice(0, 95);
  }

  return "ticket";
}

async function hardRenameOpenedTicketThread(threadId, categoryKey, targetName, actorId, attempt = 1) {
  const cleanName = stripTicketStatusPrefixes(targetName || "ticket").slice(0, 95);
  const reason = `Ticketname nach Öffnung zurückgesetzt von ${actorId}`;

  if (!cleanName || cleanName.length < 2) {
    console.error(`⚠️ Hard-Rename Versuch ${attempt}: ungültiger Zielname`, cleanName);
    return false;
  }

  try {
    await ticketTimeout(
      client.rest.patch(Routes.channel(threadId), {
        body: {
          name: cleanName,
          archived: false,
          locked: false,
        },
        reason,
      }),
      9000,
      `Hard-Rename REST Versuch ${attempt}`
    );

    await query(
      `UPDATE ticket_records SET current_name = $2, updated_at = NOW() WHERE thread_id = $1`,
      [threadId, cleanName]
    ).catch((err) => console.error("⚠️ Hard-Rename DB-Update fehlgeschlagen:", err?.message || err));

    const fresh = await fetchFreshTicketThread(threadId, categoryKey).catch(() => null);
    console.log(`✅ Hard-Rename Versuch ${attempt}: Ziel=${cleanName} Discord=${fresh?.name || "unbekannt"}`);
    return true;
  } catch (err) {
    console.error(`⚠️ Hard-Rename Versuch ${attempt} fehlgeschlagen:`, err?.message || err);
    return false;
  }
}

function getClosingTicketName(ticket) {
  return `closing-${getRestoreTicketName(ticket)}`.slice(0, 95);
}

function getTicketActorPing(ticket) {
  if (ticket?.claimed_by) return `<@${ticket.claimed_by}>`;
  if (ticket?.close_requested_by) return `<@${ticket.close_requested_by}>`;
  return "";
}

function getSafeInteractionChannel(interaction) {
  return interaction.channel?.isThread?.() ? interaction.channel : null;
}

function getRuntimeRemovedSet(threadId) {
  if (!ticketRemovalBlocklist.has(threadId)) ticketRemovalBlocklist.set(threadId, new Set());
  return ticketRemovalBlocklist.get(threadId);
}

async function getRemovedTicketUserIds(threadId) {
  const res = await query(`SELECT user_id FROM ticket_removed_members WHERE thread_id = $1`, [threadId]).catch(() => ({ rows: [] }));
  const removed = new Set(res.rows.map((row) => row.user_id));

  const runtimeSet = ticketRemovalBlocklist.get(threadId);
  if (runtimeSet) {
    for (const userId of runtimeSet) removed.add(userId);
  }

  return removed;
}

async function isTicketUserRemoved(threadId, userId) {
  const runtimeSet = ticketRemovalBlocklist.get(threadId);
  if (runtimeSet?.has(userId)) return true;

  const res = await query(
    `SELECT 1 FROM ticket_removed_members WHERE thread_id = $1 AND user_id = $2 LIMIT 1`,
    [threadId, userId]
  ).catch(() => ({ rows: [] }));

  return Boolean(res.rows[0]);
}

async function markTicketUserRemoved(threadId, userId, removedBy) {
  getRuntimeRemovedSet(threadId).add(userId);

  await query(
    `
    INSERT INTO ticket_removed_members (thread_id, user_id, removed_by)
    VALUES ($1, $2, $3)
    ON CONFLICT (thread_id, user_id)
    DO UPDATE SET removed_by = EXCLUDED.removed_by,
                  removed_at = NOW();
    `,
    [threadId, userId, removedBy]
  );
}

async function unmarkTicketUserRemoved(threadId, userId) {
  const runtimeSet = ticketRemovalBlocklist.get(threadId);
  if (runtimeSet) runtimeSet.delete(userId);

  await query(`DELETE FROM ticket_removed_members WHERE thread_id = $1 AND user_id = $2`, [threadId, userId]).catch(() => null);
}

async function forceRemoveTicketMember(thread, userId, reason = "Ticket-Mitglied entfernt") {
  const results = [];

  try {
    await thread.members.remove(userId);
    results.push("✅ Direktes Entfernen ausgeführt");
  } catch (err) {
    results.push(`❌ Direktes Entfernen fehlgeschlagen: ${err?.code || "NO_CODE"}: ${err?.message || err}`);
  }

  setTimeout(async () => {
    const stillBlocked = await isTicketUserRemoved(thread.id, userId).catch(() => false);
    if (!stillBlocked) return;

    let stillInThread = null;
    try {
      stillInThread = await thread.members.fetch(userId);
    } catch (err) {
      stillInThread = null;
      results.push("✅ Prüfung: User ist nicht mehr im Thread");
    }

    if (stillInThread) {
      try {
        await thread.members.remove(userId);
        results.push("🔁 Retry ausgeführt, weil User noch im Thread war");
      } catch (err) {
        results.push(`❌ Retry fehlgeschlagen: ${err?.code || "NO_CODE"}: ${err?.message || err}`);
      }
    }

    const nl = String.fromCharCode(10);
    await sendTicketDebugLog(
      [
        `🧹 **Ticket-Remove Debug**`,
        `Thread: ${thread.name} (${thread.id})`,
        `User: <@${userId}> (${userId})`,
        results.join(nl),
      ].join(nl)
    ).catch(() => null);
  }, 2000);
}

async function ensureTicketThread(interaction) {
  if (!interaction.channel?.isThread?.()) {
    await interaction.reply({ content: "❌ Dieser Command kann nur in einem Ticket-Thread genutzt werden.", ephemeral: true });
    return null;
  }

  const ticket = await getOrRecoverTicketFromThread(interaction.channel);
  if (!ticket) {
    await interaction.reply({
      content:
        "❌ Dieser Thread ist kein bekanntes Ticket. " +
        "Bitte nutze Ticket-Commands nur in Tickets, die über das Ticketpanel erstellt wurden.",
      ephemeral: true,
    });
    return null;
  }

  return ticket;
}

async function sendTicketDebugLog(message) {
  console.log(message);

  const channel = await client.channels.fetch(TICKET_DEBUG_CHANNEL_ID).catch(() => null);
  if (!channel) return;

  await channel.send({ content: message.slice(0, 1900) }).catch(() => null);
}

async function fetchCachedGuildMembersForTickets(guild, roleIds) {
  const members = guild.members.cache.filter((member) => {
    if (!member || member.user?.bot) return false;
    return memberHasAnyRole(member, roleIds);
  });

  return {
    members,
    source: "guild.members.cache",
    error: null,
  };
}

let ticketFullMemberFetchPromise = null;
let ticketLastFullMemberFetchAt = 0;
const ticketAutoAddJobs = new Set();

function ticketSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getDiscordRetryAfterMs(err, fallbackMs = 8000) {
  const retrySeconds =
    err?.data?.retry_after ??
    err?.data?.retryAfter ??
    err?.retry_after ??
    err?.retryAfter ??
    err?.rawError?.retry_after;

  const parsed = Number(retrySeconds);
  if (Number.isFinite(parsed) && parsed > 0) return Math.ceil(parsed * 1000) + 750;
  return fallbackMs;
}

async function fetchAllGuildMembersForTicketAutoAdd(guild, reason = "Ticket-Auto-Add", forceFullFetch = false) {
  if (ticketFullMemberFetchPromise) return ticketFullMemberFetchPromise;

  const now = Date.now();
  const cooldownMs = 90 * 1000;
  const cacheHasUsefulMembers = guild.members.cache.filter((m) => !m.user?.bot).size > 0;

  if (!forceFullFetch && cacheHasUsefulMembers && now - ticketLastFullMemberFetchAt < cooldownMs) {
    return guild.members.cache;
  }

  ticketFullMemberFetchPromise = (async () => {
    try {
      console.log(`🔄 Member-Fetch für ${reason} wird im Hintergrund gestartet...`);
      const members = await guild.members.fetch();
      ticketLastFullMemberFetchAt = Date.now();
      console.log(`✅ Member-Fetch fertig: ${members.size} Mitglieder im Cache.`);
      return members;
    } catch (err) {
      const waitMs = getDiscordRetryAfterMs(err, 9000);
      console.error(`⚠️ Member-Fetch wurde limitiert/ist fehlgeschlagen. Nutze Cache und retry in ${Math.round(waitMs / 1000)}s.`, err?.message || err);

      setTimeout(async () => {
        try {
          console.log("🔁 Member-Fetch Retry für Ticket-Auto-Add startet...");
          const members = await guild.members.fetch();
          ticketLastFullMemberFetchAt = Date.now();
          console.log(`✅ Member-Fetch Retry fertig: ${members.size} Mitglieder im Cache.`);
        } catch (retryErr) {
          console.error("❌ Member-Fetch Retry fehlgeschlagen:", retryErr?.message || retryErr);
        }
      }, waitMs);

      return guild.members.cache;
    } finally {
      ticketFullMemberFetchPromise = null;
    }
  })();

  return ticketFullMemberFetchPromise;
}

async function addRoleMembersToThreadFromCache(thread, guild, categoryKey, sourceLabel) {
  const allowedRoles = ticketAutoAddRoles(categoryKey);
  const removedUserIds = await getRemovedTicketUserIds(thread.id).catch(() => new Set());

  const candidates = guild.members.cache.filter((member) => {
    if (!member || member.user?.bot) return false;
    if (removedUserIds.has(member.id)) return false;
    return memberHasAnyRole(member, allowedRoles);
  });

  const added = [];
  const alreadyInThread = [];
  const failed = [];

  for (const [, member] of candidates) {
    try {
      if (await isTicketUserRemoved(thread.id, member.id)) continue;

      if (thread.members.cache?.has?.(member.id)) {
        alreadyInThread.push(`${member.user.tag} (${member.id})`);
        continue;
      }

      await thread.members.add(member.id);
      added.push(`${member.user.tag} (${member.id})`);
      await ticketSleep(450);
    } catch (err) {
      failed.push(`${member.user.tag} (${member.id}) → ${err?.code || "NO_CODE"}: ${err?.message || err}`);
      console.error(`❌ Konnte ${member.user.tag} (${member.id}) nicht zum Ticket-Thread hinzufügen:`, err?.message || err);
    }
  }

  const roleText = allowedRoles.map((roleId) => {
    const role = guild.roles.cache.get(roleId);
    return role ? `${role.name} (${roleId})` : roleId;
  }).join("\n");

  await sendTicketDebugLog(
    `🎫 **Ticket-Auto-Add** (${categoryKey})
` +
    `Thread: ${thread.name} (${thread.id})
` +
    `Quelle: **${sourceLabel}**
` +
    `Erlaubte Rollen:
${roleText}

` +
    `Gefundene Teammitglieder: **${candidates.size}**
` +
    `Neu hinzugefügt: **${added.length}**
` +
    `Schon drin: **${alreadyInThread.length}**
` +
    `Fehlgeschlagen: **${failed.length}**

` +
    (added.length ? `**Hinzugefügt:**
${added.slice(0, 15).join("\n")}

` : "") +
    (failed.length ? `**Fehler:**
${failed.slice(0, 10).join("\n")}` : "✅ Auto-Add abgeschlossen.")
  ).catch(() => null);

  return { added: added.length, failed: failed.length, found: candidates.size, already: alreadyInThread.length };
}

function scheduleTicketStaffAutoAdd(threadId, categoryKey, delayMs = 1500) {
  const jobKey = `${threadId}:${categoryKey}`;
  if (ticketAutoAddJobs.has(jobKey)) return;
  ticketAutoAddJobs.add(jobKey);

  const needsFullStaffFetch = categoryKey === "bungalow" || categoryKey === "allgemein";

  // Bungalow und Allgemeine Anfrage sollen wirklich alle passenden Staff-Rollen bekommen.
  // Deshalb laufen mehrere Nachzieh-Versuche. Falls Discord beim ersten Full-Fetch limitiert,
  // versucht der Bot es später erneut und lädt die fehlenden Teammitglieder nach.
  const passes = needsFullStaffFetch
    ? [
        { wait: 0, force: false, label: "Cache-Sofortcheck" },
        { wait: 3500, force: true, label: "Full-Fetch Nachziehen 1" },
        { wait: 12000, force: true, label: "Full-Fetch Nachziehen 2" },
        { wait: 30000, force: true, label: "Full-Fetch Nachziehen 3" },
      ]
    : [
        { wait: 0, force: false, label: "Cache-Sofortcheck" },
        { wait: 3500, force: true, label: "Restricted-Rollen Nachziehen" },
      ];

  setTimeout(async () => {
    try {
      const guild = await client.guilds.fetch(GUILD_ID).catch(() => null);
      const thread = await client.channels.fetch(threadId).catch(() => null);

      if (!guild || !thread?.isThread?.()) {
        console.error("❌ Ticket-Auto-Add Hintergrundjob: Guild oder Thread nicht gefunden.");
        return;
      }

      await thread.join().catch((err) => {
        console.error("⚠️ Bot konnte dem Ticket-Thread nicht beitreten:", err?.message || err);
      });

      for (const pass of passes) {
        if (pass.wait > 0) await ticketSleep(pass.wait);

        try {
          if (pass.force) {
            await fetchAllGuildMembersForTicketAutoAdd(guild, `${pass.label} | Ticket ${thread.name}`, true);
          }

          await addRoleMembersToThreadFromCache(thread, guild, categoryKey, pass.label);
        } catch (passErr) {
          console.error(`❌ Ticket-Auto-Add Pass fehlgeschlagen (${pass.label}):`, passErr?.message || passErr);
        }
      }
    } catch (err) {
      console.error("❌ Ticket-Auto-Add Hintergrundjob fehlgeschlagen:", err?.message || err);
    } finally {
      ticketAutoAddJobs.delete(jobKey);
    }
  }, delayMs);
}

async function addAllowedStaffToThread(thread, categoryKey) {
  try {
    const guild = await client.guilds.fetch(GUILD_ID).catch(() => null);
    if (!guild) {
      console.error("❌ Guild konnte für Ticket-Auto-Add nicht geladen werden.");
      return { added: 0, failed: 0, found: 0 };
    }

    await thread.join().catch((err) => {
      console.error("⚠️ Bot konnte dem Ticket-Thread nicht beitreten:", err?.message || err);
    });

    // Bungalow und Allgemeine Anfrage sollen exakt dieselben Staff-Rollen bekommen.
    // Deshalb wird hier VOR dem ersten Hinzufügen einmal aktiv der Member-Cache geladen.
    // So werden nicht nur die 1-2 gerade gecachten Personen eingeladen.
    if (categoryKey === "bungalow" || categoryKey === "allgemein") {
      await fetchAllGuildMembersForTicketAutoAdd(guild, `Direkter Staff-Fetch für ${categoryKey}`, true).catch((err) => {
        console.error(`⚠️ Direkter Staff-Fetch für ${categoryKey} fehlgeschlagen, nutze Cache:`, err?.message || err);
      });
    }

    const result = await addRoleMembersToThreadFromCache(thread, guild, categoryKey, "Direkter Staff-Add");
    scheduleTicketStaffAutoAdd(thread.id, categoryKey, 2500);

    return result;
  } catch (err) {
    console.error("❌ Fehler in addAllowedStaffToThread:", err?.message || err);
    scheduleTicketStaffAutoAdd(thread.id, categoryKey, 3000);
    return { added: 0, failed: 1, found: 0 };
  }
}

async function createTicketFromButton(interaction, categoryKey) {
  await interaction.deferReply({ ephemeral: true }).catch(() => null);

  try {
    const category = TICKET_CATEGORIES[categoryKey];
    if (!category) {
      return interaction.editReply({ content: "❌ Diese Ticket-Kategorie existiert nicht." }).catch(() => null);
    }

    const parentChannel = await client.channels.fetch(category.channelId).catch(() => null);
    if (!parentChannel || !parentChannel.threads) {
      return interaction.editReply({ content: "❌ Der Ticket-Channel wurde nicht gefunden oder ist kein Textchannel." }).catch(() => null);
    }

    const baseName = `${category.emoji}-${category.short}-anfrage`;
    const thread = await parentChannel.threads.create({
      name: baseName,
      autoArchiveDuration: 1440,
      type: ChannelType.PrivateThread,
      invitable: false,
      reason: `Ticket erstellt von ${interaction.user.tag}`,
    });

    await thread.join().catch(() => null);
    await thread.members.add(interaction.user.id).catch((err) => {
      console.error("❌ Ticket-Ersteller konnte nicht zum Thread hinzugefügt werden:", err?.message || err);
    });

    const insert = await query(
      `
      INSERT INTO ticket_records (thread_id, opener_id, category, base_name, current_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
      `,
      [thread.id, interaction.user.id, categoryKey, baseName, baseName]
    );

    const ticketId = insert.rows[0].id;

    const embed = new EmbedBuilder()
      .setColor(0x5dade2)
      .setTitle(`${category.emoji} ・${category.label.toUpperCase()}`)
      .setDescription(
        `Willkommen <@${interaction.user.id}>.\n\n` +
          `${category.description}\n\n` +
          "Bitte beschreibe dein Anliegen so genau wie möglich. Ein Teammitglied wird sich darum kümmern.\n\n" +
          "━━━━━━━━━━━━━━━━━━━━\n" +
          `🎫 Ticket-ID: **#${ticketId}**\n` +
          `👤 Erstellt von: <@${interaction.user.id}>\n` +
          `📌 Status: **Offen**\n` +
          "━━━━━━━━━━━━━━━━━━━━"
      )
      .setFooter({ text: "Pearls • Ticket-System" })
      .setTimestamp();

    await thread.send({
      content: `@everyone <@${interaction.user.id}>`,
      embeds: [embed],
      components: [ticketThreadButtons()],
      allowedMentions: {
        parse: ["everyone"],
        users: [interaction.user.id],
      },
    }).catch((err) => {
      console.error("❌ Ticket-Startnachricht konnte nicht gesendet werden:", err?.message || err);
    });

    await interaction.editReply({ content: `✅ Dein Ticket wurde erstellt: ${thread}
⏳ Teammitglieder werden im Hintergrund hinzugefügt.` }).catch(() => null);

    addAllowedStaffToThread(thread, categoryKey).then((staffAddResult) => {
      console.log(`🎫 Ticket erstellt: ${categoryKey} | Gefunden: ${staffAddResult.found || 0} | Hinzugefügt: ${staffAddResult.added || 0} | Fehler: ${staffAddResult.failed || 0}`);
    }).catch((err) => {
      console.error("❌ Ticket-Auto-Add Hintergrundfehler:", err?.message || err);
      scheduleTicketStaffAutoAdd(thread.id, categoryKey, 3000);
    });
  } catch (err) {
    console.error("❌ Fehler beim Erstellen des Tickets:", err);
    return interaction.editReply({
      content: "❌ Beim Erstellen des Tickets ist ein Fehler passiert. Schau bitte in die Railway Logs.",
    }).catch(() => null);
  }
}

async function claimTicket(interaction) {
  const ticket = await ensureTicketThread(interaction);
  if (!ticket) return;

  if (!canUseTicketStaffCommands(interaction.member, ticket.category)) {
    return interaction.reply({ content: "❌ Du darfst dieses Ticket nicht übernehmen.", ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: false });

  const category = TICKET_CATEGORIES[ticket.category];
  const handlerName = memberTicketName(interaction.member, interaction.user);
  const newName = `${handlerName}-${category.emoji}-${category.short}`.slice(0, 95);

  await interaction.channel.setName(newName, `Ticket übernommen von ${interaction.user.tag}`).catch((err) => {
    console.error("❌ Ticket konnte beim Claim nicht umbenannt werden:", err?.message || err);
  });

  await query(
    `
    UPDATE ticket_records
    SET claimed_by = $2,
        current_name = $3,
        status = 'open',
        updated_at = NOW()
    WHERE thread_id = $1;
    `,
    [interaction.channel.id, interaction.user.id, newName]
  ).catch((err) => console.error("❌ Ticket-Claim DB-Update fehlgeschlagen:", err));

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle("📌 ・TICKET ÜBERNOMMEN")
    .setDescription(`<@${interaction.user.id}> hat dieses Ticket übernommen.`)
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function ticketTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} Timeout nach ${Math.round(ms / 1000)} Sekunden`)), ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

function safeThreadRename(thread, newName, reason, label = "Thread umbenennen") {
  if (!thread?.setName || !newName) return;

  setTimeout(() => {
    thread.setName(newName, reason)
      .then(() => console.log(`✅ ${label}: ${newName}`))
      .catch((err) => console.error(`⚠️ ${label} fehlgeschlagen:`, err?.message || err));
  }, 250);
}

function safeThreadUnarchiveUnlock(thread, reason = "Ticket freigeben") {
  if (!thread?.isThread?.()) return;

  setTimeout(async () => {
    await thread.setArchived(false, reason).catch((err) => {
      console.error("⚠️ Thread entarchivieren fehlgeschlagen:", err?.message || err);
    });

    await thread.setLocked(false, reason).catch((err) => {
      console.error("⚠️ Thread entsperren fehlgeschlagen:", err?.message || err);
    });
  }, 250);
}

async function fetchTicketThreadForOpen(threadId, categoryKey = null) {
  if (!threadId) return null;

  let thread = await ticketTimeout(
    client.channels.fetch(threadId, { force: true }),
    8000,
    "Ticket-Thread direkt laden"
  ).catch((err) => {
    console.error("⚠️ Ticket-Open: direkter Thread-Fetch fehlgeschlagen:", err?.message || err);
    return null;
  });

  if (thread?.isThread?.()) return thread;

  const category = categoryKey ? TICKET_CATEGORIES[categoryKey] : null;
  const parentIds = category?.channelId
    ? [category.channelId]
    : Object.values(TICKET_CATEGORIES).map((cat) => cat.channelId);

  for (const parentId of [...new Set(parentIds)]) {
    const parent = await ticketTimeout(
      client.channels.fetch(parentId, { force: true }),
      8000,
      `Ticket-Elternkanal laden ${parentId}`
    ).catch((err) => {
      console.error(`⚠️ Ticket-Open: Parent-Fetch fehlgeschlagen (${parentId}):`, err?.message || err);
      return null;
    });

    if (!parent?.threads?.fetch) continue;

    thread = await ticketTimeout(
      parent.threads.fetch(threadId),
      8000,
      `Ticket-Thread über Parent laden ${parentId}`
    ).catch((err) => {
      console.error(`⚠️ Ticket-Open: Parent-Thread-Fetch fehlgeschlagen (${parentId}):`, err?.message || err);
      return null;
    });

    if (thread?.isThread?.()) return thread;
  }

  return null;
}

function waitMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchFreshTicketThread(threadId, categoryKey = null) {
  const thread = await fetchTicketThreadForOpen(threadId, categoryKey).catch((err) => {
    console.error("⚠️ Ticket-Open: Thread konnte nicht frisch geladen werden:", err?.message || err);
    return null;
  });

  return thread?.isThread?.() ? thread : null;
}

async function forceRenameOpenTicketThread(threadId, categoryKey, safeName, actorId, attempt = 1) {
  const cleanName = stripTicketStatusPrefixes(safeName || "ticket").slice(0, 95);

  if (!cleanName || cleanName.length < 2) {
    console.error(`⚠️ Ticket-Open Rename Versuch ${attempt}: ungültiger Zielname`, cleanName);
    return false;
  }

  const hardOk = await hardRenameOpenedTicketThread(threadId, categoryKey, cleanName, actorId, attempt);
  if (hardOk) return true;

  const thread = await fetchFreshTicketThread(threadId, categoryKey);
  if (!thread?.isThread?.()) {
    console.error(`⚠️ Ticket-Open Rename Versuch ${attempt}: Thread nicht gefunden`, threadId);
    return false;
  }

  try {
    await ticketTimeout(
      thread.edit({ archived: false, locked: false, name: cleanName }, `Ticketname nach Öffnung zurückgesetzt von ${actorId}`),
      9000,
      `Ticket-Open edit Rename Versuch ${attempt}`
    );

    await query(
      `UPDATE ticket_records SET current_name = $2, updated_at = NOW() WHERE thread_id = $1`,
      [threadId, cleanName]
    ).catch((err) => console.error("⚠️ Ticket-Open Rename DB-Update fehlgeschlagen:", err?.message || err));

    const check = await fetchFreshTicketThread(threadId, categoryKey).catch(() => null);
    console.log(`✅ Ticket-Open Titel geändert Versuch ${attempt}: ${threadId} -> ${check?.name || cleanName}`);
    return true;
  } catch (err) {
    console.error(`⚠️ Ticket-Open Titel ändern Versuch ${attempt} fehlgeschlagen:`, err?.message || err);
    return false;
  }
}

async function forceOpenTicketThread(threadId, categoryKey, restoreName, actorId) {
  let thread = await fetchFreshTicketThread(threadId, categoryKey);

  if (!thread) {
    console.error("❌ Ticket-Open: Thread nicht gefunden:", threadId);
    return null;
  }

  const reason = `Ticket wieder geöffnet von ${actorId}`;
  const safeName = getOpenTicketName(null, thread, restoreName);

  await ticketTimeout(
    thread.edit({ locked: false, archived: false, name: safeName }, reason),
    8000,
    "Thread schnell öffnen + Namen setzen"
  ).catch((err) => {
    console.error("⚠️ Ticket-Open: Schnelles Öffnen/Rename fehlgeschlagen:", err?.message || err);
  });

  hardRenameOpenedTicketThread(threadId, categoryKey, safeName, actorId, 0).catch(() => null);

  thread = (await fetchFreshTicketThread(threadId, categoryKey)) || thread;

  setTimeout(() => forceRenameOpenTicketThread(threadId, categoryKey, safeName, actorId, 1), 1000);
  setTimeout(() => forceRenameOpenTicketThread(threadId, categoryKey, safeName, actorId, 2), 3500);
  setTimeout(() => forceRenameOpenTicketThread(threadId, categoryKey, safeName, actorId, 3), 8000);
  setTimeout(() => forceRenameOpenTicketThread(threadId, categoryKey, safeName, actorId, 4), 15000);

  console.log(
    `🔎 Ticket-Open Schnellstatus: thread=${threadId} archived=${thread.archived} locked=${thread.locked} name=${thread.name} targetName=${safeName}`
  );

  return thread;
}

function scheduleTicketOpenFinalization(threadId, ticket, actorId, restoreName) {
  setTimeout(async () => {
    console.log(`🔓 Ticket-Open-Schnellfinalisierung gestartet: ${threadId}`);

    const thread = await forceOpenTicketThread(threadId, ticket?.category, restoreName, actorId).catch((err) => {
      console.error("❌ Ticket-Open-Schnellfinalisierung fehlgeschlagen:", err?.message || err);
      return null;
    });

    if (!thread?.isThread?.()) {
      console.error("❌ Ticket-Open-Schnellfinalisierung abgebrochen: Thread nicht gefunden", threadId);
      return;
    }

    await ticketTimeout(
      thread.send({
        content:
          `@everyone\n\n` +
          `🔓 ・**TICKET WIEDER GEÖFFNET**\n\n` +
          `<@${actorId}> hat dieses Ticket wieder geöffnet.\n\n` +
          `✅ Status: **Offen**`,
        allowedMentions: { parse: ["everyone"], users: [actorId] },
      }),
      6000,
      "Ticket-Open Nachricht senden"
    ).catch((err) => {
      console.error("⚠️ Ticket-Open: Öffentliche Nachricht konnte nicht gesendet werden:", err?.message || err);
    });

    scheduleTicketStaffAutoAdd(thread.id, ticket.category, 500);

    setTimeout(() => {
      forceOpenTicketThread(threadId, ticket?.category, restoreName, actorId).catch((err) => {
        console.error("⚠️ Ticket-Open Sicherheits-Fix fehlgeschlagen:", err?.message || err);
      });
    }, 3000);

    console.log(`✅ Ticket-Open-Schnellfinalisierung beendet: ${threadId}`);
  }, 0);
}

function scheduleTicketArchiveFinalization(thread, closedName) {
  if (!thread?.isThread?.()) return;

  setTimeout(async () => {
    console.log(`🔒 Ticket-Archivierung im Hintergrund gestartet: ${thread.id}`);

    await thread.setName(closedName, "Ticket geschlossen").catch((err) => {
      console.error("⚠️ Ticket konnte beim Schließen nicht umbenannt werden:", err?.message || err);
    });

    await thread.setLocked(true, "Ticket geschlossen").catch((err) => {
      console.error("⚠️ Ticket konnte nicht gelockt werden:", err?.message || err);
    });

    await thread.setArchived(true, "Ticket geschlossen").catch((err) => {
      console.error("⚠️ Ticket konnte nicht archiviert werden:", err?.message || err);
    });

    console.log(`✅ Ticket-Archivierung im Hintergrund beendet: ${thread.id}`);
  }, 750);
}

async function requestTicketClose(interaction) {
  await interaction.deferReply({ ephemeral: true }).catch(() => null);
  await interaction.editReply({ content: "⏳ Schließungsanfrage wird vorbereitet..." }).catch(() => null);

  try {
    if (!interaction.channel?.isThread?.()) {
      return interaction.editReply({
        content: "❌ Dieser Command kann nur direkt in einem Ticket-Thread genutzt werden.",
      }).catch(() => null);
    }

    const thread = interaction.channel;
    console.log(`🔒 Ticket-Close gestartet: ${thread.name} (${thread.id}) von ${interaction.user.tag}`);

    const ticket = await ticketTimeout(getOrRecoverTicketFromThread(thread), 7000, "Ticket-Daten laden").catch((err) => {
      console.error("❌ Ticket-Daten konnten bei /ticket-close nicht geladen werden:", err?.message || err);
      return null;
    });

    if (!ticket) {
      return interaction.editReply({
        content: "❌ Dieses Ticket konnte nicht aus der Datenbank geladen werden. Bitte prüfe Railway/PostgreSQL.",
      }).catch(() => null);
    }

    if (!canUseTicketStaffCommands(interaction.member, ticket.category)) {
      return interaction.editReply({ content: "❌ Du darfst dieses Ticket nicht schließen." }).catch(() => null);
    }

    if (ticket.status === "closing_requested") {
      return interaction.editReply({ content: "⚠️ Für dieses Ticket läuft bereits eine Schließungsanfrage." }).catch(() => null);
    }

    const deadline = new Date(Date.now() + TICKET_CLOSE_AFTER_MS);
    const closingName = getClosingTicketName(ticket);

    const dbStart = await ticketTimeout(
      query(
        `
        UPDATE ticket_records
        SET status = 'closing_requested',
            close_requested_by = $2,
            close_requested_at = NOW(),
            close_deadline_at = $3,
            close_message_id = NULL,
            updated_at = NOW()
        WHERE thread_id = $1;
        `,
        [thread.id, interaction.user.id, deadline]
      ),
      7000,
      "Ticket-Close DB-Vorbereitung"
    ).catch((err) => {
      console.error("❌ Ticket-Close DB-Vorbereitung fehlgeschlagen:", err?.message || err);
      return null;
    });

    if (!dbStart) {
      return interaction.editReply({ content: "❌ Die Schließungsanfrage konnte nicht in der Datenbank gespeichert werden." }).catch(() => null);
    }

    safeThreadRename(thread, closingName, `Schließungsanfrage von ${interaction.user.tag}`, "Ticket für Schließung umbenennen");

    const embed = new EmbedBuilder()
      .setColor(0xe67e22)
      .setTitle("🔒 ・SCHLIESSUNGSANFRAGE")
      .setDescription(
        `<@${interaction.user.id}> möchte dieses Ticket schließen.\n\n` +
          `Du hast nun **2 Tage Zeit**, die Schließung zu bestätigen oder abzulehnen.\n\n` +
          "━━━━━━━━━━━━━━━━━━━━\n" +
          "⏳ Frist: läuft in **2 Tagen** ab"
      )
      .setFooter({ text: "Pearls • Ticket-Schließung" })
      .setTimestamp();

    const msg = await ticketTimeout(
      thread.send({
        content: `<@${ticket.opener_id}>`,
        embeds: [embed],
        components: [ticketCloseButtons(thread.id)],
        allowedMentions: { users: [ticket.opener_id] },
      }),
      10000,
      "Schließungsnachricht senden"
    ).catch((err) => {
      console.error("❌ Schließungsnachricht konnte nicht gesendet werden:", err?.message || err);
      return null;
    });

    if (!msg) {
      await query(
        `
        UPDATE ticket_records
        SET status = 'open',
            close_requested_by = NULL,
            close_requested_at = NULL,
            close_deadline_at = NULL,
            close_message_id = NULL,
            updated_at = NOW()
        WHERE thread_id = $1;
        `,
        [thread.id]
      ).catch((err) => console.error("❌ Ticket-Close Rollback fehlgeschlagen:", err?.message || err));

      return interaction.editReply({
        content: "❌ Die Schließungsanfrage konnte nicht gesendet werden. Der Ticketstatus wurde wieder geöffnet.",
      }).catch(() => null);
    }

    await ticketTimeout(
      query(`UPDATE ticket_records SET close_message_id = $2, updated_at = NOW() WHERE thread_id = $1`, [thread.id, msg.id]),
      5000,
      "Close-Message-ID speichern"
    ).catch((err) => console.error("⚠️ Close-Message-ID konnte nicht gespeichert werden:", err?.message || err));

    console.log(`✅ Ticket-Close erfolgreich gestartet: ${thread.id}`);
    return interaction.editReply({ content: "✅ Schließungsanfrage wurde gestellt." }).catch(() => null);
  } catch (err) {
    console.error("❌ Fehler bei /ticket-close:", err?.message || err);
    return interaction.editReply({
      content: "❌ Beim Schließen des Tickets ist ein Fehler passiert. Schau bitte in die Railway Logs.",
    }).catch(() => null);
  }
}

async function archiveTicketForDeletion(thread, ticket, actorId, reasonText) {
  const deleteAt = new Date(Date.now() + TICKET_DELETE_AFTER_CLOSE_MS);
  const restoreName = getRestoreTicketName(ticket);
  const closedName = `closed-${restoreName}`.slice(0, 95);

  await ticketTimeout(
    query(
      `
      UPDATE ticket_records
      SET status = 'closed',
          current_name = $2,
          close_requested_by = NULL,
          close_requested_at = NULL,
          close_deadline_at = NULL,
          close_message_id = NULL,
          delete_after_at = $3,
          updated_at = NOW()
      WHERE thread_id = $1;
      `,
      [ticket.thread_id, restoreName, deleteAt]
    ),
    7000,
    "Ticket-Archiv DB-Update"
  ).catch((err) => console.error("❌ Ticket-Archiv DB-Update fehlgeschlagen:", err?.message || err));

  await ticketTimeout(
    thread.send({
      content:
        `✅ ・TICKET GESCHLOSSEN\n\n` +
        `${actorId ? `<@${actorId}> hat die Schließung bestätigt.\n` : "Die Schließungsfrist ist abgelaufen.\n"}` +
        `${reasonText || "Das Ticket wurde geschlossen."}\n\n` +
        `Der Thread wird jetzt **gelockt und archiviert**.\n` +
        `Er kann innerhalb von **2 Tagen** mit \`/ticket-open thread_id:${ticket.thread_id}\` wieder geöffnet werden.\n` +
        `Danach wird er automatisch gelöscht.`,
      allowedMentions: { users: actorId ? [actorId] : [] },
    }),
    8000,
    "Ticket-Geschlossen-Nachricht senden"
  ).catch((err) => console.error("⚠️ Ticket-Geschlossen-Nachricht konnte nicht gesendet werden:", err?.message || err));

  scheduleTicketArchiveFinalization(thread, closedName);
}

async function handleTicketCloseDecision(interaction, closeToken, decision) {
  async function runStep(label, promiseFactory, timeoutMs = 5000) {
    try {
      const result = await ticketTimeout(Promise.resolve().then(promiseFactory), timeoutMs, label);
      console.log(`✅ ${label}`);
      return { ok: true, result };
    } catch (err) {
      console.error(`❌ ${label}:`, err?.message || err);
      return { ok: false, error: err };
    }
  }

  async function safePrivate(content) {
    try {
      if (interaction.deferred || interaction.replied) {
        return await interaction.editReply({ content }).catch(async () => interaction.followUp({ content, ephemeral: true }).catch(() => null));
      }
      return await interaction.reply({ content, ephemeral: true }).catch(() => null);
    } catch (err) {
      console.error("⚠️ Private Ticket-Antwort fehlgeschlagen:", err?.message || err);
      return null;
    }
  }

  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true });
    }
  } catch (err) {
    console.error("❌ Close-Button konnte nicht sofort bestätigt werden:", err?.message || err);
  }

  await safePrivate(decision === "confirm" ? "⏳ Ticket wird geschlossen..." : "⏳ Schließungsanfrage wird abgebrochen...");

  try {
    console.log(`🔄 Ticket-Close-Decision gestartet | decision=${decision} | token=${closeToken}`);

    let thread = interaction.channel?.isThread?.() ? interaction.channel : null;
    let ticket = null;

    if (thread?.isThread?.()) {
      const ticketResult = await runStep("Ticket aus aktuellem Thread laden", () => getTicketByThread(thread.id), 4000);
      ticket = ticketResult.result || null;

      if (!ticket) {
        const recoverResult = await runStep("Ticket aus Thread recovern", () => getOrRecoverTicketFromThread(thread), 4000);
        ticket = recoverResult.result || null;
      }
    }

    if (!ticket) {
      const tokenResult = await runStep("Ticket per Close-Token laden", () => getTicketFromCloseToken(closeToken), 4000);
      ticket = tokenResult.result || null;
    }

    if (!thread && ticket?.thread_id) {
      const threadResult = await runStep("Ticket-Thread per ID laden", () => client.channels.fetch(ticket.thread_id), 5000);
      thread = threadResult.result || null;
    }

    if (!thread || !thread.isThread?.()) {
      return safePrivate("❌ Der Ticket-Thread wurde nicht gefunden. Bitte prüfe, ob der Thread noch existiert.");
    }

    if (!ticket) {
      return safePrivate("❌ Das Ticket wurde in der Datenbank nicht gefunden. Bitte erstelle ein neues Ticket über das Ticketpanel.");
    }

    const memberCanManage = interaction.member && canUseTicketStaffCommands(interaction.member, ticket.category);
    const isTicketOpener = interaction.user.id === ticket.opener_id;

    if (!isTicketOpener && !memberCanManage) {
      return safePrivate("❌ Nur der Ticket-Ersteller oder berechtigte Teammitglieder dürfen diese Schließung bestätigen oder abbrechen.");
    }

    if (decision === "confirm") {
      await runStep("Close-Buttons deaktivieren", () => interaction.message.edit({ components: disableActionRows(interaction.message.components) }), 4000);
      await runStep("Ticket schließen: DB und Nachricht", () => archiveTicketForDeletion(thread, ticket, interaction.user.id, "Das Ticket wurde bestätigt geschlossen."), 12000);
      console.log(`✅ Ticket-Schließung bestätigt | thread=${ticket.thread_id || thread.id}`);
      return safePrivate("✅ Ticket wurde geschlossen. Lock/Archivierung läuft im Hintergrund, damit nichts mehr hängt.");
    }

    const restoreName = getRestoreTicketName(ticket);
    const threadId = ticket.thread_id || thread.id;

    await runStep(
      "DB-Status auf open zurücksetzen",
      () =>
        query(
          `
          UPDATE ticket_records
          SET status = 'open',
              current_name = $2,
              close_requested_by = NULL,
              close_requested_at = NULL,
              close_deadline_at = NULL,
              close_message_id = NULL,
              delete_after_at = NULL,
              updated_at = NOW()
          WHERE thread_id = $1;
          `,
          [threadId, restoreName]
        ),
      5000
    );

    await runStep("Schließen/Abbrechen-Buttons deaktivieren", () => interaction.message.edit({ components: disableActionRows(interaction.message.components) }), 4000);

    safeThreadUnarchiveUnlock(thread, "Schließungsanfrage abgebrochen");
    safeThreadRename(thread, restoreName, `Schließung abgebrochen von ${interaction.user.tag}`, "Threadname nach Abbruch zurücksetzen");

    const sendResult = await runStep(
      "Öffentliche Abbruch-Nachricht senden",
      () =>
        thread.send({
          content:
            `@everyone\n\n` +
            `❌ ・**SCHLIESSUNGSANFRAGE ABGEBROCHEN**\n\n` +
            `<@${interaction.user.id}> hat die Schließungsanfrage abgebrochen.\n\n` +
            `📌 Status: **Offen**\n` +
            `Das Ticket kann wieder normal bearbeitet und später erneut geschlossen werden.`,
          allowedMentions: { parse: ["everyone"], users: [interaction.user.id] },
        }),
      8000
    );

    if (!sendResult.ok) {
      return safePrivate("⚠️ Der Ticketstatus wurde zurückgesetzt, aber die öffentliche Nachricht konnte nicht gesendet werden. Prüfe Bot-Rechte im Thread.");
    }

    console.log(`✅ Schließungsanfrage erfolgreich abgebrochen | thread=${threadId}`);
    return safePrivate("✅ Schließungsanfrage wurde abgebrochen. Das Ticket ist wieder offen und @everyone wurde erwähnt.");
  } catch (err) {
    console.error("❌ Unerwarteter Fehler bei Ticket-Schließungsentscheidung:", err?.message || err);
    return safePrivate("❌ Beim Verarbeiten der Schließungsentscheidung ist ein Fehler passiert. Schau bitte in die Railway Logs.");
  }
}

async function checkTicketCloseDeadlines() {
  const expiredRequests = await query(
    `
    SELECT *
    FROM ticket_records
    WHERE status = 'closing_requested'
      AND close_deadline_at IS NOT NULL
      AND close_deadline_at <= NOW();
    `
  ).catch(() => ({ rows: [] }));

  for (const ticket of expiredRequests.rows) {
    const channel = await client.channels.fetch(ticket.thread_id).catch(() => null);
    if (channel) {
      await archiveTicketForDeletion(channel, ticket, null, "Die Schließungsanfrage wurde nicht innerhalb von 2 Tagen beantwortet.");
    } else {
      await query(
        `UPDATE ticket_records SET status = 'closed', delete_after_at = NOW() + INTERVAL '2 days', updated_at = NOW() WHERE thread_id = $1`,
        [ticket.thread_id]
      ).catch(() => null);
    }
  }

  const deleteReady = await query(
    `
    SELECT *
    FROM ticket_records
    WHERE status = 'closed'
      AND delete_after_at IS NOT NULL
      AND delete_after_at <= NOW();
    `
  ).catch(() => ({ rows: [] }));

  for (const ticket of deleteReady.rows) {
    const channel = await client.channels.fetch(ticket.thread_id).catch(() => null);

    if (channel) {
      await channel.delete("Geschlossenes Ticket nach 2 Tagen automatisch gelöscht").catch((err) => {
        console.error("❌ Geschlossenes Ticket konnte nicht automatisch gelöscht werden:", err?.message || err);
      });
    }

    await query(
      `UPDATE ticket_records SET status = 'deleted', delete_after_at = NULL, updated_at = NOW() WHERE thread_id = $1`,
      [ticket.thread_id]
    ).catch(() => null);
  }
}

async function sendManagementMessage(content) {
  const channel = await client.channels.fetch(MANAGEMENT_OUTPUT_CHANNEL_ID);
  await channel.send({ content });
}

async function sendTrainingMessage(content) {
  const channel = await client.channels.fetch(TRAINING_OUTPUT_CHANNEL_ID);
  await channel.send({ content });
}

async function sendWarning(targetUserId, warningRoleId, reason, issuerId) {
  const guild = await client.guilds.fetch(GUILD_ID);
  const targetMember = await guild.members.fetch(targetUserId).catch(() => null);

  if (targetMember) {
    await targetMember.roles.add(warningRoleId, `Verwarnung ausgestellt von ${issuerId}`).catch((err) => {
      console.error(`❌ Verwarnungsrolle konnte nicht vergeben werden: ${warningRoleId}`, err);
    });
  }

  await query(
    `
    INSERT INTO warning_records (user_id, warning_role_id, issuer_id, reason)
    VALUES ($1, $2, $3, $4);
    `,
    [targetUserId, warningRoleId, issuerId, reason]
  );

  await sendManagementMessage(
    `**⚠️Verwarnung⚠️**\n` +
      `Name: <@${targetUserId}>\n` +
      `Grund: ${reason}\n` +
      `Verwarnung: <@&${warningRoleId}>\n` +
      `Ausgestellt von: <@${issuerId}>`
  );
}

async function safeAddRoles(targetMember, roleIds) {
  const ids = Array.isArray(roleIds) ? roleIds : [roleIds];
  const added = [];
  const failed = [];

  for (const roleId of ids) {
    try {
      await targetMember.roles.add(roleId, "Teamupdate über Management-Panel");
      added.push(roleId);
    } catch (err) {
      console.error(`❌ Rolle konnte nicht vergeben werden: ${roleId}`, err);
      failed.push(roleId);
    }
  }

  return { added, failed };
}

async function safeRemoveRoles(targetMember, roleIds) {
  const ids = Array.isArray(roleIds) ? roleIds : [roleIds];
  const removed = [];
  const failed = [];

  for (const roleId of ids) {
    try {
      await targetMember.roles.remove(roleId);
      removed.push(roleId);
    } catch (err) {
      console.error(`❌ Rolle konnte nicht entfernt werden: ${roleId}`, err);
      failed.push(roleId);
    }
  }

  return { removed, failed };
}

async function applyTeamUpdateRoles(targetMember, updateType) {
  let roleIds = [];
  let removeRoleIds = [];

  if (updateType === "probe_employee") {
    roleIds = [TEAMUPDATE_PROBE_EMPLOYEE_ROLE_ID, TEAMUPDATE_EMPLOYEE_BASE_ROLE_ID];
    removeRoleIds = [];
  }

  if (updateType === "employee") {
    roleIds = [TEAMUPDATE_EMPLOYEE_ROLE_ID, TEAMUPDATE_EMPLOYEE_BASE_ROLE_ID];
    removeRoleIds = [TEAMUPDATE_PROBE_EMPLOYEE_ROLE_ID, PROBE_ROLE_ID];
  }

  if (updateType === "casino_employee") {
    roleIds = [TEAMUPDATE_CASINO_EMPLOYEE_ROLE_ID, TEAMUPDATE_CASINO_BASE_ROLE_ID];
    removeRoleIds = [];
  }

  if (updateType === "probe_manager") {
    roleIds = [TEAMUPDATE_MANAGEMENT_BASE_ROLE_ID, TEAMUPDATE_PROBE_MANAGER_ROLE_ID];
    removeRoleIds = [];
  }

  if (updateType === "manager") {
    roleIds = [TEAMUPDATE_MANAGER_ROLE_ID, TEAMUPDATE_MANAGEMENT_BASE_ROLE_ID];
    removeRoleIds = [TEAMUPDATE_PROBE_MANAGER_ROLE_ID];
  }

  if (updateType === "personal_manager") {
    roleIds = [TEAMUPDATE_PERSONAL_MANAGER_ROLE_ID, TEAMUPDATE_MANAGEMENT_BASE_ROLE_ID];
    removeRoleIds = [];
  }

  if (!roleIds.length) {
    throw new Error(`Unbekannter Teamupdate-Typ: ${updateType}`);
  }

  const addResult = await safeAddRoles(targetMember, roleIds);
  const removeResult = removeRoleIds.length
    ? await safeRemoveRoles(targetMember, removeRoleIds)
    : { removed: [], failed: [] };

  return {
    roleText: roleIds.map((id) => `<@&${id}>`).join(" + ") || "Unbekannt",
    failedAdd: addResult.failed,
    failedRemove: removeResult.failed,
  };
}

async function sendTeamUpdate(targetUserId, updateType, issuerId) {
  const guild = await client.guilds.fetch(GUILD_ID);
  const targetMember = await guild.members.fetch(targetUserId).catch(() => null);

  if (!targetMember) throw new Error("Target member not found");

  const roleResult = await applyTeamUpdateRoles(targetMember, updateType);

  await query(
    `INSERT INTO personnel_events (user_id, issuer_id, event_type, details) VALUES ($1, $2, $3, $4)`,
    [targetUserId, issuerId, "Beförderung", `Beförderung zu ${roleResult.roleText}`]
  ).catch(() => null);

  await sendManagementMessage(
    `**🎉 BEFÖRDERUNG 🎉**\n\n` +
      `Herzlichen Glückwunsch <@${targetUserId}>,\n` +
      `du wurdest offiziell zum ${roleResult.roleText} befördert! 🥳\n\n` +
      `Wir danken dir für deine Arbeit, deine Zuverlässigkeit und deinen Einsatz im Pearls.\n` +
      `Mach weiter so – wir freuen uns auf die weitere Zusammenarbeit mit dir! 💛\n\n` +
      `Ausgestellt von: <@${issuerId}>`
  );
}

async function deleteEmployeeTimeData(userId) {
  await query(`DELETE FROM active_sessions WHERE user_id = $1`, [userId]);
  await query(`DELETE FROM work_sessions WHERE user_id = $1`, [userId]);
  await query(`DELETE FROM absences WHERE user_id = $1`, [userId]);
  await query(`DELETE FROM employees WHERE user_id = $1`, [userId]);
}

async function sendTermination(targetUserId, note, issuerId) {
  const guild = await client.guilds.fetch(GUILD_ID);
  const targetMember = await guild.members.fetch(targetUserId).catch(() => null);

  if (targetMember) {
    await safeRemoveRoles(targetMember, TERMINATION_REMOVE_ROLE_IDS);
  }

  await deleteEmployeeTimeData(targetUserId);
  await updateTotalWorktimeMessage();
  await updateWeeklyWorktimeMessage();

  await sendManagementMessage(
    `**Kündigung**\n` +
      `<@${targetUserId}> hat uns verlassen.\n` +
      `Notiz: ${note}\n\n` +
      `Ausgestellt von: <@${issuerId}>`
  );
}

async function sendWarningRemove(targetUserId, warningRoleId, issuerId) {
  const guild = await client.guilds.fetch(GUILD_ID);
  const targetMember = await guild.members.fetch(targetUserId).catch(() => null);

  if (targetMember) {
    await targetMember.roles.remove(warningRoleId, `Verwarnung zurückgezogen von ${issuerId}`).catch((err) => {
      console.error(`❌ Verwarnungsrolle konnte nicht entfernt werden: ${warningRoleId}`, err);
    });
  }

  await query(
    `
    UPDATE warning_records
    SET active = FALSE
    WHERE user_id = $1
      AND warning_role_id = $2
      AND active = TRUE;
    `,
    [targetUserId, warningRoleId]
  );

  await sendManagementMessage(
    `**🔄 Verwarnung Zurückgezogen🔄 **\n` +
      `Name: <@${targetUserId}>\n` +
      `Folgende Verwarnung wurde zurückgezogen: <@&${warningRoleId}>\n\n` +
      `Du hast dich bewiesen – mach genauso weiter und hör auf, Mist zu bauen! 💛\n\n` +
      `Ausgestellt von: <@${issuerId}>`
  );
}

async function sendTraining(targetUserId, instructorId, date, issuerId) {
  await query(
    `INSERT INTO personnel_events (user_id, issuer_id, event_type, details) VALUES ($1, $2, $3, $4)`,
    [targetUserId, issuerId, "Einweisung", `Einweisung durch <@${instructorId}> am ${date}`]
  ).catch(() => null);

  await sendTrainingMessage(
    `**🧠 EINWEISUNG DOKUMENTIERT 🧠**

` +
      `Mitarbeiter: <@${targetUserId}>
` +
      `Einweisung durch: <@${instructorId}>
` +
      `Datum: ${date}

` +
      `Eingetragen von: <@${issuerId}>`
  );
}

async function sendOrUpdatePermanentMessage(channelId, key, payload) {
  const channel = await client.channels.fetch(channelId);
  const oldMessageId = await getSetting(key, null);

  if (oldMessageId) {
    try {
      const msg = await channel.messages.fetch(oldMessageId);
      await msg.edit(payload);
      return;
    } catch {}
  }

  const msg = await channel.send(payload);
  await setSetting(key, msg.id);
}

async function getOnlineUsersMap() {
  const active = await query(`SELECT user_id FROM active_sessions`);
  const map = {
        time_add_user: "time_add",
        time_remove_user: "time_remove",
        time_set_weekly_user: "time_set_weekly",
        time_set_total_user: "time_set_total",
        time_view_user: "time_view",};

  for (const row of active.rows) {
    map[row.user_id] = true;
  }

  return map;
}

async function updateTotalWorktimeMessage() {
  const result = await query(`
    SELECT user_id, total_minutes AS minutes
    FROM employees
    WHERE left_server = FALSE
    ORDER BY total_minutes DESC;
  `);

  const onlineMap = await getOnlineUsersMap();

  let page = Number(await getSetting("total_page", "0"));
  const totalPages = Math.max(1, Math.ceil(result.rows.length / LEADERBOARD_PAGE_SIZE));

  if (page >= totalPages) page = totalPages - 1;
  if (page < 0) page = 0;

  await setSetting("total_page", page);

  const start = page * LEADERBOARD_PAGE_SIZE;
  const pageRows = result.rows.slice(start, start + LEADERBOARD_PAGE_SIZE);

  const description = pageRows.length
    ? pageRows
        .map((r, i) => {
          const realIndex = start + i;
          const dot = onlineMap[r.user_id] ? "🟢 " : "";
          return `${medal(realIndex)} ${dot}<@${r.user_id}>\n└ 🕒 **${formatMinutes(r.minutes)}**`;
        })
        .join("\n\n")
    : "Noch keine Zeiten vorhanden.";

  const embed = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle("💠 ・TIMEDESK • GESAMTZEITEN")
    .setDescription(description)
    .setFooter({ text: `Live aktualisiert alle 2 Minuten | Seite ${page + 1}/${totalPages}` })
    .setTimestamp();

  await sendOrUpdatePermanentMessage(TOTAL_WORKTIME_CHANNEL_ID, "total_worktime_message_id", {
    embeds: [embed],
    components: [leaderboardButtons("total", page, totalPages)],
  });
}

async function updateWeeklyWorktimeMessage() {
  const result = await query(`
    SELECT user_id, weekly_minutes AS minutes
    FROM employees
    WHERE left_server = FALSE
    ORDER BY weekly_minutes DESC;
  `);

  const onlineMap = await getOnlineUsersMap();

  let page = Number(await getSetting("weekly_page", "0"));
  const totalPages = Math.max(1, Math.ceil(result.rows.length / LEADERBOARD_PAGE_SIZE));

  if (page >= totalPages) page = totalPages - 1;
  if (page < 0) page = 0;

  await setSetting("weekly_page", page);

  const start = page * LEADERBOARD_PAGE_SIZE;
  const pageRows = result.rows.slice(start, start + LEADERBOARD_PAGE_SIZE);

  const description = pageRows.length
    ? pageRows
        .map((r, i) => {
          const realIndex = start + i;
          const dot = onlineMap[r.user_id] ? "🟢 " : "";
          return `${medal(realIndex)} ${dot}<@${r.user_id}>\n└ 🕒 **${formatMinutes(r.minutes)}**`;
        })
        .join("\n\n")
    : "Noch keine Zeiten vorhanden.";

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle("💎 ・TIMEDESK • WEEKLY LEADERBOARD")
    .setDescription(description)
    .setFooter({ text: `Live aktualisiert alle 2 Minuten | Seite ${page + 1}/${totalPages}` })
    .setTimestamp();

  await sendOrUpdatePermanentMessage(WEEKLY_WORKTIME_CHANNEL_ID, "weekly_worktime_message_id", {
    embeds: [embed],
    components: [leaderboardButtons("weekly", page, totalPages)],
  });
}

async function sendTimeLog(type, member, text) {
  const channel = await client.channels.fetch(TIME_LOG_CHANNEL_ID);

  const colors = {
    in: 0x2ecc71,
    out: 0xe74c3c,
    pause: 0xf1c40f,
    resume: 0x3498db,
  };

  const titles = {
    in: "🟢 ・DIENST GESTARTET",
    out: "🔴 ・DIENST BEENDET",
    pause: "⏸️ ・PAUSE GESTARTET",
    resume: "▶️ ・PAUSE BEENDET",
  };

  const embed = new EmbedBuilder()
    .setColor(colors[type] || 0xffffff)
    .setTitle(titles[type] || "Log")
    .setDescription(`${member}\n${text}`)
    .setTimestamp();

  await channel.send({ embeds: [embed] });
}

async function checkRankup(userId) {
  const employee = await query(`SELECT total_minutes, rankup_notified FROM employees WHERE user_id = $1`, [userId]);

  if (!employee.rows[0]) return;
  if (employee.rows[0].rankup_notified) return;
  if (employee.rows[0].total_minutes < PROBE_RANKUP_MINUTES) return;

  const guild = await client.guilds.fetch(GUILD_ID);
  const member = await guild.members.fetch(userId).catch(() => null);

  if (!member) return;
  if (!member.roles.cache.has(PROBE_ROLE_ID)) return;

  const channel = await client.channels.fetch(PERSONAL_OVERVIEW_CHANNEL_ID);

  const embed = new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle("🚨 Probezeit-Ziel erreicht!")
    .setDescription(
      `<@${userId}> hat insgesamt **10 Arbeitsstunden** erreicht.\n\n` +
        `📈 Es wird Zeit für ein mögliches **Rank-Up**.\n` +
        `💸 Bitte denkt daran, das **Gehalt entsprechend anzupassen**.\n\n` +
        `<@&${PERSONAL_MANAGER_ROLE_ID}>`
    )
    .setTimestamp();

  await channel.send({ content: `<@&${PERSONAL_MANAGER_ROLE_ID}>`, embeds: [embed] });

  await query(`UPDATE employees SET rankup_notified = TRUE WHERE user_id = $1`, [userId]);
}

async function finishSession(userId, autoClockout = false, forcedEndAt = new Date()) {
  const res = await query(`SELECT * FROM active_sessions WHERE user_id = $1`, [userId]);
  const session = res.rows[0];
  if (!session) return null;

  let pausedMs = Number(session.paused_ms || 0);

  if (session.pause_started_at) {
    pausedMs += forcedEndAt.getTime() - new Date(session.pause_started_at).getTime();
  }

  const startedAt = new Date(session.started_at);

  const minutes = Math.max(0, Math.floor((forcedEndAt.getTime() - startedAt.getTime() - pausedMs) / 60000));

  const inserted = await query(
    `
    INSERT INTO work_sessions (user_id, started_at, ended_at, minutes, auto_clockout)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id;
    `,
    [userId, startedAt, forcedEndAt, minutes, autoClockout]
  );

  await query(
    `
    UPDATE employees
    SET total_minutes = total_minutes + $2,
        weekly_minutes = weekly_minutes + $2
    WHERE user_id = $1;
    `,
    [userId, minutes]
  );

  await query(`DELETE FROM active_sessions WHERE user_id = $1`, [userId]);

  const guild = await client.guilds.fetch(GUILD_ID);
  const member = await guild.members.fetch(userId).catch(() => null);

  if (member) {
    await member.roles.remove(DUTY_ROLE_ID).catch(() => {});

    await sendTimeLog(
      "out",
      `<@${userId}>`,
      autoClockout
        ? `⚠️ Automatisch ausgestempelt\n🕒 Gespeicherte Arbeitszeit: **${formatShortMinutes(minutes)}**`
        : `🕒 Arbeitszeit: **${formatShortMinutes(minutes)}**`
    );
  }

  await checkRankup(userId);
  await updateTotalWorktimeMessage();
  await updateWeeklyWorktimeMessage();
  await updateDashboardMessage().catch(() => null);

  return { sessionId: inserted.rows[0].id, minutes };
}

async function deleteReminderMessage(session) {
  if (!session?.reminder_message_id) return;

  const channel = await client.channels.fetch(REMINDER_CHANNEL_ID).catch(() => null);
  if (!channel) return;

  const msg = await channel.messages.fetch(session.reminder_message_id).catch(() => null);
  if (msg) await msg.delete().catch(() => {});
}

async function checkReminders() {
  const now = new Date();
  const active = await query(`SELECT * FROM active_sessions`);

  for (const session of active.rows) {
    if (session.pause_started_at) continue;

    const userId = session.user_id;

    if (session.reminder_deadline_at && new Date(session.reminder_deadline_at) <= now) {
      await deleteReminderMessage(session);

      const endAt = new Date(session.reminder_sent_at);
      const finished = await finishSession(userId, true, endAt);
      if (!finished) continue;

      const channel = await client.channels.fetch(CORRECTION_CHANNEL_ID);

      const embed = new EmbedBuilder()
        .setColor(0xe67e22)
        .setTitle("🕒 Automatische Ausstempelung")
        .setDescription(
          `<@${userId}> du wurdest automatisch ausgestempelt.\n\n` +
            `Gespeicherte Zeit: **${formatShortMinutes(finished.minutes)}**\n` +
            `Bitte korrigiere deine tatsächliche Arbeitszeit, falls diese nicht stimmt.`
        )
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`correct_time_${finished.sessionId}_${userId}`)
          .setLabel("Arbeitszeit korrigieren")
          .setEmoji("🕒")
          .setStyle(ButtonStyle.Primary)
      );

      await channel.send({ content: `<@${userId}>`, embeds: [embed], components: [row] });
      continue;
    }

    if (!session.reminder_message_id) {
      const elapsed = now.getTime() - new Date(session.started_at).getTime() - Number(session.paused_ms || 0);

      if (elapsed >= REMINDER_AFTER_MS) {
        const channel = await client.channels.fetch(REMINDER_CHANNEL_ID);

        const embed = new EmbedBuilder()
          .setColor(0xf1c40f)
          .setTitle("🛡️ Aktivitätsprüfung")
          .setDescription(
            `<@${userId}> bist du noch im Dienst?\n\n` +
              `Bitte bestätige innerhalb von **10 Minuten**, sonst wirst du automatisch ausgestempelt.`
          )
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`confirm_active_${userId}`).setLabel("Ich bin noch da").setEmoji("✅").setStyle(ButtonStyle.Success)
        );

        const msg = await channel.send({ content: `<@${userId}>`, embeds: [embed], components: [row] });

        await query(
          `
          UPDATE active_sessions
          SET reminder_message_id = $2,
              reminder_sent_at = $3,
              reminder_deadline_at = $4
          WHERE user_id = $1;
          `,
          [userId, msg.id, now, new Date(now.getTime() + REMINDER_RESPONSE_MS)]
        );
      }
    }
  }
}

async function checkWarningReviewReminders() {
  const res = await query(`
    SELECT *
    FROM warning_records
    WHERE active = TRUE
      AND reminded = FALSE
      AND issued_at <= NOW() - INTERVAL '14 days';
  `);

  if (!res.rows.length) return;

  const channel = await client.channels.fetch(PERSONAL_OVERVIEW_CHANNEL_ID);

  for (const warning of res.rows) {
    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle("⚠️ Verwarnung seit 2 Wochen aktiv")
      .setDescription(
        `<@${warning.user_id}> hat seit **2 Wochen** folgende Verwarnung aktiv:

` +
          `Verwarnung: <@&${warning.warning_role_id}>
` +
          `Grund: ${warning.reason}

` +
          `Bitte prüfen, ob die Verwarnung zurückgezogen werden soll.

` +
          `<@&${PERSONAL_MANAGER_ROLE_ID}>`
      )
      .setTimestamp();

    await channel.send({ content: `<@&${PERSONAL_MANAGER_ROLE_ID}>`, embeds: [embed] });
    await query(`UPDATE warning_records SET reminded = TRUE WHERE id = $1`, [warning.id]);
  }
}

function getBerlinParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
}

async function weeklyResetOnly() {
  const p = getBerlinParts();
  const todayKey = `${p.year}-${p.month}-${p.day}`;

  if (p.weekday !== "Mo." || p.hour !== "00" || p.minute !== "00") return;

  const already = await getSetting("last_weekly_reset", null);
  if (already === todayKey) return;

  await query(`UPDATE employees SET weekly_minutes = 0`);
  await setSetting("last_weekly_reset", todayKey);
  await setSetting("weekly_page", "0");
  await updateWeeklyWorktimeMessage();
  await updateDashboardMessage().catch(() => null);
  await updateWeeklyStatisticsMessage().catch(() => null);
}

async function syncEmployeeRoles() {
  const guild = await client.guilds.fetch(GUILD_ID);
  const members = await guild.members.fetch();
  const employees = await query(`SELECT user_id FROM employees`);

  for (const employee of employees.rows) {
    const member = members.get(employee.user_id);
    const hasEmployeeRole = member?.roles.cache.has(EMPLOYEE_ROLE_ID) || false;

    await query(`UPDATE employees SET left_server = $2 WHERE user_id = $1`, [employee.user_id, !hasEmployeeRole]);

    if (!hasEmployeeRole) {
      await query(`DELETE FROM active_sessions WHERE user_id = $1`, [employee.user_id]);
      if (member) await member.roles.remove(DUTY_ROLE_ID).catch(() => {});
    }
  }

  await updateTotalWorktimeMessage();
  await updateWeeklyWorktimeMessage();
  console.log("✅ Mitarbeiter-Rollen wurden synchronisiert.");
}

async function getCleanUserDisplay(userId) {
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(userId).catch(() => null);

    if (member) {
      const name = member.nickname || member.user.globalName || member.user.username;
      return `└ ${name}`;
    }

    const user = await client.users.fetch(userId).catch(() => null);
    if (user) return `└ ${user.globalName || user.username}`;

    return `└ User ${userId}`;
  } catch {
    return `└ User ${userId}`;
  }
}

async function updateDashboardMessage() {
  const activeSessions = await query(`SELECT user_id FROM active_sessions`);
  const activeWarnings = await query(`SELECT COUNT(*)::int AS count FROM warning_records WHERE active = TRUE`);
  const oldWarnings = await query(`
    SELECT COUNT(*)::int AS count
    FROM warning_records
    WHERE active = TRUE
      AND issued_at <= NOW() - INTERVAL '14 days'
  `);
  const activeStands = await query(`SELECT COUNT(*)::int AS count FROM active_stands WHERE status = 'active'`).catch(() => ({ rows: [{ count: 0 }] }));
  const employees = await query(`SELECT COUNT(*)::int AS count, COALESCE(AVG(weekly_minutes), 0)::int AS avg_weekly FROM employees WHERE left_server = FALSE`);
  const activeAbsences = await query(`
    SELECT COUNT(*)::int AS count
    FROM absences
    WHERE date_from <= CURRENT_DATE
      AND date_to >= CURRENT_DATE
  `);
  const weekAbsences = await query(`
    SELECT COUNT(*)::int AS count
    FROM absences
    WHERE date_from <= CURRENT_DATE + INTERVAL '7 days'
      AND date_to >= CURRENT_DATE
  `);

  const lastStockCheck = await query(`
    SELECT *
    FROM stock_check_logs
    ORDER BY created_at DESC
    LIMIT 1
  `).catch(() => ({ rows: [] }));

  const activeList = activeSessions.rows.length
    ? (await Promise.all(activeSessions.rows.map((r) => getCleanUserDisplay(r.user_id)))).join("\\n").slice(0, 900)
    : "Aktuell ist niemand eingestempelt.";

  const stockStatus = lastStockCheck.rows[0]
    ? `Letzte Prüfung: <t:${Math.floor(new Date(lastStockCheck.rows[0].created_at).getTime() / 1000)}:R> von <@${lastStockCheck.rows[0].user_id}>`
    : "Noch keine Lagerprüfung gespeichert.";

  const embed = new EmbedBuilder()
    .setColor(0x5dade2)
    .setTitle("💠 ・PEARLS DASHBOARD")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
        "**Live-Übersicht für Management & Personal**\n" +
        "Alle wichtigen Aufgaben und Zeiten auf einen Blick.\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .addFields(
      {
        name: "👥 **Team & Zeiten**",
        value:
          `🟢 **Im Dienst**
└ ${activeSessions.rows.length}

` +
          `👥 **Mitarbeiter in Liste**
└ ${employees.rows[0]?.count || 0}

` +
          `📊 **Ø Weekly-Zeit**
└ ${formatShortMinutes(employees.rows[0]?.avg_weekly || 0)}`,
      },
      {
        name: "👩‍💼 **Personal Management — Offene Aufgaben**",
        value:
          `• Alte Verwarnungen prüfen: **${oldWarnings.rows[0]?.count || 0}**
` +
          `• Abmeldungen im Blick behalten: **${weekAbsences.rows[0]?.count || 0}**`,
      },
      {
        name: "👨‍💼 **Management — Offene Aufgaben**",
        value:
          `• Aktive Stände prüfen: **${activeStands.rows[0]?.count || 0}**
` +
          `• Einkaufsliste kontrollieren
` +
          `• Lager alle 2 Tage prüfen`,
      },
      {
        name: activeSessions.rows.length > 0 ? "🟢 **Eingestempelte Mitarbeiter**" : "🔴 **Aktuell im Dienst**",
        value: activeList,
      }
    )
    .setFooter({ text: "Pearls • Dashboard & offene Aufgaben • Live aktualisiert" })
    .setTimestamp();

  await sendOrUpdatePermanentMessage(DASHBOARD_CHANNEL_ID, "dashboard_message_id", {
    embeds: [embed],
    components: [],
  });
}

async function sendActiveStandMessage({ requestMessageId = null, creatorId, name, location, time }) {
  const channel = await client.channels.fetch(ACTIVE_STANDS_CHANNEL_ID).catch(() => null);
  if (!channel) return null;

  const embed = new EmbedBuilder()
    .setColor(0x5dade2)
    .setTitle("🍽️ ・AKTIVER ESSENSSTAND")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
        `📌 **Stand/Event:** ${name}\n` +
        `📍 **Ort:** ${location}\n` +
        `🕒 **Uhrzeit:** ${time}\n` +
        `👤 **Betreiber:** <@${creatorId}>\n` +
        `✅ **Status:** Aktiv\n` +
        "━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setFooter({ text: "Pearls • Aktive Stände" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("stand_close")
      .setLabel("Stand schließen")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger)
  );

  const msg = await channel.send({ embeds: [embed], components: [row] });

  await query(
    `
    INSERT INTO active_stands (message_id, request_message_id, creator_id, name, location, time_text, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'active')
    `,
    [msg.id, requestMessageId, creatorId, name, location, time]
  );

  await updateDashboardMessage().catch(() => null);
  return msg;
}

async function closeActiveStandByMessage(messageId, closerId) {
  const res = await query(`SELECT * FROM active_stands WHERE message_id = $1 AND status = 'active'`, [messageId]);
  const stand = res.rows[0];
  if (!stand) return null;

  await query(`UPDATE active_stands SET status = 'closed', closed_at = NOW() WHERE id = $1`, [stand.id]);

  const channel = await client.channels.fetch(ACTIVE_STANDS_CHANNEL_ID).catch(() => null);
  if (channel) {
    const msg = await channel.messages.fetch(messageId).catch(() => null);
    if (msg) {
      const embed = new EmbedBuilder()
        .setColor(0x95a5a6)
        .setTitle("🔒 ・ESSENSSTAND GESCHLOSSEN")
        .setDescription(
          "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
            `📌 **Stand/Event:** ${stand.name}\n` +
            `📍 **Ort:** ${stand.location}\n` +
            `🕒 **Uhrzeit:** ${stand.time_text}\n` +
            `👤 **Betreiber:** <@${stand.creator_id}>\n` +
            `🔒 **Geschlossen von:** <@${closerId}>\n` +
            "━━━━━━━━━━━━━━━━━━━━━━━━"
        )
        .setFooter({ text: "Pearls • Aktive Stände" })
        .setTimestamp();

      await msg.edit({ embeds: [embed], components: [] }).catch(() => null);
    }
  }

  await updateDashboardMessage().catch(() => null);
  return stand;
}

async function buildPersonalFileEmbed(userId) {
  const employee = await query(`SELECT * FROM employees WHERE user_id = $1`, [userId]);
  const warnings = await query(`
    SELECT *
    FROM warning_records
    WHERE user_id = $1
    ORDER BY issued_at DESC
    LIMIT 10
  `, [userId]);
  const absences = await query(`
    SELECT *
    FROM absences
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 5
  `, [userId]);
  const sessions = await query(`
    SELECT *
    FROM work_sessions
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 5
  `, [userId]);
  const notes = await query(`
    SELECT *
    FROM personal_file_notes
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 5
  `, [userId]).catch(() => ({ rows: [] }));

  const events = await query(`
    SELECT *
    FROM personnel_events
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 8
  `, [userId]).catch(() => ({ rows: [] }));

  const e = employee.rows[0];
  const activeWarnings = warnings.rows.filter((w) => w.active);

  const warningText = warnings.rows.length
    ? warnings.rows
        .map((w) => `• <@&${w.warning_role_id}> ${w.active ? "✅ aktiv" : "❌ zurückgezogen"}\n  Grund: ${w.reason}`)
        .join("\n")
        .slice(0, 1000)
    : "Keine Verwarnungen gespeichert.";

  const absenceText = absences.rows.length
    ? absences.rows
        .map((a) => `• ${new Date(a.date_from).toLocaleDateString("de-DE")} bis ${new Date(a.date_to).toLocaleDateString("de-DE")} — ${a.reason}`)
        .join("\n")
        .slice(0, 1000)
    : "Keine Abmeldungen gespeichert.";

  const sessionText = sessions.rows.length
    ? sessions.rows
        .map((s) => `• ${formatShortMinutes(s.minutes)} ${s.corrected ? "(korrigiert)" : ""}`)
        .join("\n")
        .slice(0, 1000)
    : "Keine letzten Sitzungen gespeichert.";

  const notesText = notes.rows.length
    ? notes.rows
        .map((n) => `• ${n.note}\n  von <@${n.issuer_id}>`)
        .join("\n")
        .slice(0, 1000)
    : "Keine internen Notizen gespeichert.";

  const eventsText = events.rows.length
    ? events.rows
        .map((ev) => `• **${ev.event_type}** — ${ev.details}\n  von ${ev.issuer_id ? `<@${ev.issuer_id}>` : "System"}`)
        .join("\n")
        .slice(0, 1000)
    : "Keine Personalereignisse gespeichert.";

  return new EmbedBuilder()
    .setColor(0x5dade2)
    .setTitle("📁 ・PERSONALAKTE")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
        `👤 **Mitarbeiter:** <@${userId}>\n` +
        `🕒 **Gesamtzeit:** ${formatShortMinutes(e?.total_minutes || 0)}\n` +
        `📊 **Weekly-Zeit:** ${formatShortMinutes(e?.weekly_minutes || 0)}\n` +
        `⚠️ **Aktive Verwarnungen:** ${activeWarnings.length}\n` +
        `📌 **Status:** ${e?.left_server ? "Nicht aktiv / nicht in Liste" : "Aktiv in Mitarbeiterliste"}\n` +
        "━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .addFields(
      { name: "⚠️ Verwarnungen", value: warningText || "Keine Daten." },
      { name: "📅 Letzte Abmeldungen", value: absenceText || "Keine Daten." },
      { name: "🕒 Letzte Arbeitszeiten", value: sessionText || "Keine Daten." },
      { name: "📌 Personalereignisse", value: eventsText || "Keine Daten." },
      { name: "📝 Interne Notizen", value: notesText || "Keine Daten." }
    )
    .setFooter({ text: "Pearls • Personalakten" })
    .setTimestamp();
}

async function sendPersonalFileToChannel(userId, requesterId) {
  const channel = await client.channels.fetch(PERSONAL_FILES_CHANNEL_ID).catch(() => null);
  if (!channel) {
    throw new Error("Personalakten-Channel wurde nicht gefunden oder der Bot hat keinen Zugriff.");
  }

  const embed = await buildPersonalFileEmbed(userId);
  return channel.send({
    content: `📁 Personalakte angefordert von <@${requesterId}>`,
    embeds: [embed],
  });
}

async function getEmployeeAnalysis(userId) {
  const employee = await query(`SELECT * FROM employees WHERE user_id = $1`, [userId]);
  const warnings = await query(`SELECT * FROM warning_records WHERE user_id = $1 AND active = TRUE`, [userId]);
  const absences = await query(`
    SELECT *
    FROM absences
    WHERE user_id = $1
      AND date_from <= CURRENT_DATE + INTERVAL '7 days'
      AND date_to >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY created_at DESC
  `, [userId]);
  const lastSession = await query(`
    SELECT *
    FROM work_sessions
    WHERE user_id = $1
    ORDER BY ended_at DESC
    LIMIT 1
  `, [userId]);

  const e = employee.rows[0];
  const total = e?.total_minutes || 0;
  const weekly = e?.weekly_minutes || 0;
  const activeWarnings = warnings.rows.length;
  const recentAbsences = absences.rows.length;
  const last = lastSession.rows[0];

  let score = 100;

  if (activeWarnings >= 2) score -= 30;
  else if (activeWarnings === 1) score -= 15;

  if (recentAbsences >= 3) score -= 15;

  if (!last) {
    score -= 10;
  } else {
    const daysSinceLast = Math.floor((Date.now() - new Date(last.ended_at).getTime()) / 86400000);
    if (daysSinceLast >= 14) score -= 25;
    else if (daysSinceLast >= 7) score -= 10;
  }

  let rating = "✅ Stabil";
  let recommendation = "Aktuell unauffällig. Weiter beobachten.";
  let color = 0x2ecc71;

  if (score < 50) {
    rating = "🚨 Kritisch";
    recommendation = "Gespräch führen und Aktivität oder Verwarnungen prüfen.";
    color = 0xe74c3c;
  } else if (score < 75) {
    rating = "⚠️ Beobachten";
    recommendation = "Im Blick behalten. Bei weiterer Inaktivität Maßnahmen prüfen.";
    color = 0xf1c40f;
  }

  return { employee: e, total, weekly, activeWarnings, recentAbsences, lastSession: last, score, rating, recommendation, color };
}

async function buildEmployeeCheckEmbed(userId) {
  const a = await getEmployeeAnalysis(userId);

  const lastSessionText = a.lastSession
    ? `${formatShortMinutes(a.lastSession.minutes)} • <t:${Math.floor(new Date(a.lastSession.ended_at).getTime() / 1000)}:R>`
    : "Keine letzte Arbeitszeit gespeichert.";

  return new EmbedBuilder()
    .setColor(a.color)
    .setTitle("🧠 ・MITARBEITERCHECK")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
        `👤 **Mitarbeiter:** <@${userId}>\n` +
        `📊 **Bewertung:** ${a.rating}\n` +
        `🧮 **Score:** ${Math.max(0, a.score)}/100\n\n` +
        `🕒 **Gesamtzeit:** ${formatShortMinutes(a.total)}\n` +
        `📈 **Weekly-Zeit:** ${formatShortMinutes(a.weekly)}\n` +
        `⚠️ **Aktive Verwarnungen:** ${a.activeWarnings}\n` +
        `📅 **Aktuelle/letzte Abmeldungen:** ${a.recentAbsences}\n` +
        `🕘 **Letzte Arbeitszeit:** ${lastSessionText}\n\n` +
        `💡 **Empfehlung:**\n${a.recommendation}\n` +
        "━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setFooter({ text: "Pearls • Automatischer Mitarbeitercheck" })
    .setTimestamp();
}

async function updateWeeklyStatisticsMessage() {
  const topWeekly = await query(`
    SELECT user_id, weekly_minutes
    FROM employees
    WHERE left_server = FALSE
    ORDER BY weekly_minutes DESC
    LIMIT 5
  `);

  const topTotal = await query(`
    SELECT user_id, total_minutes
    FROM employees
    WHERE left_server = FALSE
    ORDER BY total_minutes DESC
    LIMIT 5
  `);

  const activeWarnings = await query(`SELECT COUNT(*)::int AS count FROM warning_records WHERE active = TRUE`);
  const activeSessions = await query(`SELECT COUNT(*)::int AS count FROM active_sessions`);
  const employeeStats = await query(`
    SELECT COUNT(*)::int AS count, COALESCE(AVG(weekly_minutes), 0)::int AS avg_weekly
    FROM employees
    WHERE left_server = FALSE
  `);
  const absences = await query(`
    SELECT COUNT(*)::int AS count
    FROM absences
    WHERE date_from <= CURRENT_DATE + INTERVAL '7 days'
      AND date_to >= CURRENT_DATE
  `);

  const weeklyText = topWeekly.rows.length
    ? topWeekly.rows.map((r, i) => `${medal(i)} <@${r.user_id}> — **${formatShortMinutes(r.weekly_minutes)}**`).join("\n")
    : "Noch keine Weekly-Daten.";

  const totalText = topTotal.rows.length
    ? topTotal.rows.map((r, i) => `${medal(i)} <@${r.user_id}> — **${formatShortMinutes(r.total_minutes)}**`).join("\n")
    : "Noch keine Gesamt-Daten.";

  const embed = new EmbedBuilder()
    .setColor(0x5dade2)
    .setTitle("📈 ・WEEKLY STATISTIK")
    .setDescription("━━━━━━━━━━━━━━━━━━━━━━━━\nAutomatische Übersicht der wichtigsten Teamdaten.\n━━━━━━━━━━━━━━━━━━━━━━━━")
    .addFields(
      { name: "🏆 Top Weekly", value: weeklyText },
      { name: "💎 Top Gesamtzeiten", value: totalText },
      {
        name: "📊 Übersicht",
        value:
          `🟢 **Im Dienst:** ${activeSessions.rows[0]?.count || 0}\n` +
          `👥 **Mitarbeiter:** ${employeeStats.rows[0]?.count || 0}\n` +
          `📊 **Ø Weekly:** ${formatShortMinutes(employeeStats.rows[0]?.avg_weekly || 0)}\n` +
          `⚠️ **Aktive Verwarnungen:** ${activeWarnings.rows[0]?.count || 0}\n` +
          `📅 **Abmeldungen diese Woche:** ${absences.rows[0]?.count || 0}`,
      }
    )
    .setFooter({ text: "Pearls • Weekly Statistik • Aktualisiert automatisch" })
    .setTimestamp();

  await sendOrUpdatePermanentMessage(STATISTICS_WEEKLY_CHANNEL_ID, "weekly_statistics_message_id", {
    embeds: [embed],
    components: [],
  });
}

async function updateManagementTasksMessage() {
  return;
}

function getBerlinDateKey(date = new Date()) {
  const p = getBerlinParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

async function sendStockCheckReminderIfNeeded(force = false) {
  const p = getBerlinParts();

  if (!force && (p.hour !== "17" || p.minute !== "00")) return;

  const todayKey = getBerlinDateKey();
  const alreadyToday = await getSetting("last_stock_check_reminder", null);
  if (alreadyToday === todayKey) return;

  const lastCheck = await query(`
    SELECT created_at
    FROM stock_check_logs
    WHERE status IN ('checked', 'shopping_needed', 'problem')
    ORDER BY created_at DESC
    LIMIT 1
  `).catch(() => ({ rows: [] }));

  if (lastCheck.rows[0]?.created_at) {
    const lastCheckDate = new Date(lastCheck.rows[0].created_at);
    const diffDays = (Date.now() - lastCheckDate.getTime()) / 86400000;

    if (diffDays < 2) return;
  }

  const channel = await client.channels.fetch(STOCK_CHECK_REMINDER_CHANNEL_ID).catch(() => null);
  if (!channel) {
    console.error("❌ Lagerprüfungs-Channel wurde nicht gefunden:", STOCK_CHECK_REMINDER_CHANNEL_ID);
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x5dade2)
    .setTitle("📦 ・LAGERPRÜFUNG")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
        "Bitte überprüft heute den Lagerbestand.\n\n" +
        "📌 Achtet besonders auf:\n" +
        "└ Lebensmittelbestand\n" +
        "└ Getränkebestand\n" +
        "└ Artikel unter Mindestbestand\n" +
        "└ Dinge, die dringend nachgekauft werden müssen\n\n" +
        "Bitte nach der Prüfung einen passenden Button drücken.\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setFooter({ text: "Pearls • Lagerkontrolle alle 2 Tage" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("stock_checked").setLabel("Lager geprüft").setEmoji("✅").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("stock_shopping_needed").setLabel("Einkauf nötig").setEmoji("🛒").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("stock_problem").setLabel("Problem melden").setEmoji("⚠️").setStyle(ButtonStyle.Danger)
  );

  await channel.send({ content: `<@&${MANAGER_ROLE_ID}>`, embeds: [embed], components: [row] });

  await setSetting("last_stock_check_reminder", todayKey);
  await setSetting("last_stock_check_reminder_time", new Date().toISOString());
}

async function logStockCheck(messageId, userId, status, note = null) {
  await query(
    `INSERT INTO stock_check_logs (message_id, user_id, status, note) VALUES ($1, $2, $3, $4)`,
    [messageId, userId, status, note]
  ).catch(() => null);
}

function timeActionLabel(action) {
  const labels = {
    add: "Zeit hinzugefügt",
    remove: "Zeit entfernt",
    set_weekly: "Weekly-Zeit gesetzt",
    set_total: "Gesamtzeit gesetzt",
  };

  return labels[action] || action;
}

async function refreshAllTimeDisplays() {
  await updateTotalWorktimeMessage().catch(() => null);
  await updateWeeklyWorktimeMessage().catch(() => null);
  await updateDashboardMessage().catch(() => null);
  await updateWeeklyStatisticsMessage().catch(() => null);
  await updateManagementTasksMessage().catch(() => null);
}

async function applyManualTimeChange({ targetUserId, issuerId, action, minutes, note = null }) {
  await ensureEmployee(targetUserId);

  const before = await query(
    `SELECT weekly_minutes, total_minutes FROM employees WHERE user_id = $1`,
    [targetUserId]
  );

  const oldWeekly = before.rows[0]?.weekly_minutes || 0;
  const oldTotal = before.rows[0]?.total_minutes || 0;

  let newWeekly = oldWeekly;
  let newTotal = oldTotal;

  if (action === "add") {
    newWeekly += minutes;
    newTotal += minutes;
  }

  if (action === "remove") {
    newWeekly = Math.max(0, newWeekly - minutes);
    newTotal = Math.max(0, newTotal - minutes);
  }

  if (action === "set_weekly") {
    newWeekly = Math.max(0, minutes);
  }

  if (action === "set_total") {
    newTotal = Math.max(0, minutes);
  }

  await query(
    `
    UPDATE employees
    SET weekly_minutes = $2,
        total_minutes = $3,
        left_server = FALSE
    WHERE user_id = $1;
    `,
    [targetUserId, newWeekly, newTotal]
  );

  await query(
    `
    INSERT INTO time_adjustments (
      user_id,
      issuer_id,
      action,
      minutes,
      old_weekly_minutes,
      new_weekly_minutes,
      old_total_minutes,
      new_total_minutes,
      note
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
    `,
    [targetUserId, issuerId, action, minutes, oldWeekly, newWeekly, oldTotal, newTotal, note]
  ).catch(() => null);

  await query(
    `INSERT INTO personnel_events (user_id, issuer_id, event_type, details) VALUES ($1, $2, $3, $4)`,
    [
      targetUserId,
      issuerId,
      "Zeitverwaltung",
      `${timeActionLabel(action)}: ${formatShortMinutes(minutes)}${note ? ` • ${note}` : ""}`,
    ]
  ).catch(() => null);

  const logChannel = await client.channels.fetch(TIME_LOG_CHANNEL_ID).catch(() => null);

  if (logChannel) {
    const embed = new EmbedBuilder()
      .setColor(0x5dade2)
      .setTitle("🛠️ ・ZEITVERWALTUNG LOG")
      .setDescription(
        "━━━━━━━━━━━━━━━━━━━━━━━━\\n" +
          `👤 **Mitarbeiter**\\n└ <@${targetUserId}>\\n\\n` +
          `🛠️ **Aktion**\\n└ ${timeActionLabel(action)}\\n\\n` +
          `🕒 **Eingetragene Zeit**\\n└ ${formatShortMinutes(minutes)}\\n\\n` +
          `📈 **Weekly-Zeit**\\n└ ${formatShortMinutes(oldWeekly)} → **${formatShortMinutes(newWeekly)}**\\n\\n` +
          `💎 **Gesamtzeit**\\n└ ${formatShortMinutes(oldTotal)} → **${formatShortMinutes(newTotal)}**\\n\\n` +
          `📝 **Notiz**\\n└ ${note || "Keine Notiz"}\\n\\n` +
          `👮 **Ausgeführt von**\\n└ <@${issuerId}>\\n` +
          "━━━━━━━━━━━━━━━━━━━━━━━━"
      )
      .setFooter({ text: "Pearls • Zeitverwaltung • Transparenzlog" })
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
  }

  await refreshAllTimeDisplays();

  return {
    oldWeekly,
    newWeekly,
    oldTotal,
    newTotal,
  };
}

async function buildTimeOverviewEmbed(targetUserId) {
  await ensureEmployee(targetUserId);

  const employee = await query(
    `SELECT weekly_minutes, total_minutes FROM employees WHERE user_id = $1`,
    [targetUserId]
  );

  const adjustments = await query(
    `
    SELECT *
    FROM time_adjustments
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 5
    `,
    [targetUserId]
  ).catch(() => ({ rows: [] }));

  const e = employee.rows[0];

  const adjustmentText = adjustments.rows.length
    ? adjustments.rows
        .map((a) => `• **${timeActionLabel(a.action)}** — ${formatShortMinutes(a.minutes)}\n  von <@${a.issuer_id}>`)
        .join("\n")
        .slice(0, 1000)
    : "Keine manuellen Zeitänderungen gespeichert.";

  return new EmbedBuilder()
    .setColor(0x5dade2)
    .setTitle("📊 ・ZEITÜBERSICHT")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
        `👤 **Mitarbeiter:** <@${targetUserId}>\n` +
        `📈 **Weekly-Zeit:** ${formatShortMinutes(e?.weekly_minutes || 0)}\n` +
        `💎 **Gesamtzeit:** ${formatShortMinutes(e?.total_minutes || 0)}\n` +
        "━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .addFields({ name: "🛠️ Letzte manuellen Änderungen", value: adjustmentText })
    .setFooter({ text: "Pearls • Zeitverwaltung" })
    .setTimestamp();
}

function timeUserSelect(customId, placeholder = "Mitarbeiter auswählen") {
  return new ActionRowBuilder().addComponents(
    new UserSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)
      .setMinValues(1)
      .setMaxValues(1)
  );
}

function normalizeBusinessName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanBusinessNameFromMember(member) {
  const raw = String(
    member?.nickname ||
    member?.displayName ||
    member?.user?.globalName ||
    member?.user?.username ||
    ""
  ).trim();

  if (!raw) return null;

  let cleaned = raw
    .replace(/^[^a-zA-ZäöüÄÖÜß0-9]+/g, "")
    .replace(/^(pearls|pr|probe|mitarbeiter|employee|azubi|casino)\s*(\||i|-|–|—|:)\s*/i, "")
    .replace(/^.+?\s*(\|| i | - | – | — |:)\s*/i, (match) => {
      const lower = match.toLowerCase();
      if (lower.includes("pearls") || lower.includes("pr") || lower.includes("probe") || lower.includes("mitarbeiter") || lower.includes("casino")) return "";
      return match;
    })
    .replace(/[ ]+/g, " ")
    .trim();

  if (!cleaned || cleaned.length < 3 || !cleaned.includes(" ")) return null;

  return formatName(cleaned);
}

async function autoLinkBusinessNameFromMember(member, reason = "Automatische Business-Verknüpfung") {
  try {
    const cleanName = cleanBusinessNameFromMember(member);

    if (!cleanName) {
      console.log(`⚠️ Auto-Business-Link übersprungen für ${member?.user?.tag || member?.id}: Kein sauberer Vor- und Nachname im Nickname gefunden.`);
      return null;
    }

    const link = await upsertBusinessUserLink(member.id, cleanName, "AUTO_ROLE_SYNC");
    console.log(`✅ Auto-Business-Link gespeichert: ${cleanName} → ${member.user.tag} (${member.id}) | Grund: ${reason}`);
    return link;
  } catch (err) {
    console.error("❌ Auto-Business-Link fehlgeschlagen:", err);
    return null;
  }
}

async function upsertBusinessUserLink(userId, name, linkedBy) {
  const cleanName = String(name || "").trim().replace(/\s+/g, " ");
  const nameKey = normalizeBusinessName(cleanName);

  if (!nameKey || nameKey.length < 2) {
    throw new Error("Ungültiger Business-Name");
  }

  await ensureEmployee(userId).catch(() => null);

  const res = await query(
    `
    INSERT INTO business_name_links (name_key, user_id, name, linked_by)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (name_key)
    DO UPDATE SET user_id = EXCLUDED.user_id,
                  name = EXCLUDED.name,
                  linked_by = EXCLUDED.linked_by,
                  updated_at = NOW()
    RETURNING *;
    `,
    [nameKey, userId, cleanName, linkedBy]
  );

  return res.rows[0];
}

async function getBusinessUserLink(name) {
  const nameKey = normalizeBusinessName(name);
  if (!nameKey) return null;

  const res = await query(
    `SELECT * FROM business_name_links WHERE name_key = $1 LIMIT 1`,
    [nameKey]
  ).catch(() => ({ rows: [] }));

  return res.rows[0] || null;
}

async function listBusinessUserLinks() {
  const res = await query(
    `
    SELECT *
    FROM business_name_links
    ORDER BY updated_at DESC
    LIMIT 50;
    `
  ).catch(() => ({ rows: [] }));

  return res.rows;
}

async function deleteBusinessUserLink(name) {
  const nameKey = normalizeBusinessName(name);
  if (!nameKey) return null;

  const res = await query(
    `DELETE FROM business_name_links WHERE name_key = $1 RETURNING *`,
    [nameKey]
  ).catch(() => ({ rows: [] }));

  return res.rows[0] || null;
}

function collectEmbedTextForBusinessTimeLog(message) {
  const parts = [];

  if (message.content) parts.push(message.content);

  for (const embed of message.embeds || []) {
    if (embed.title) parts.push(embed.title);
    if (embed.description) parts.push(embed.description);
    if (embed.footer?.text) parts.push(embed.footer.text);

    for (const field of embed.fields || []) {
      if (field.name) parts.push(field.name);
      if (field.value) parts.push(field.value);
    }
  }

  return parts.join("\n");
}

function parseBusinessDurationToMinutes(rawDuration) {
  if (!rawDuration) return null;

  const text = String(rawDuration).toLowerCase();
  const hours = Number((text.match(/(\d+)\s*stunden?/) || [])[1] || 0);
  const minutes = Number((text.match(/(\d+)\s*minuten?/) || [])[1] || 0);
  const seconds = Number((text.match(/(\d+)\s*sekunden?/) || [])[1] || 0);

  const totalMinutes = hours * 60 + minutes + (seconds > 0 ? 1 : 0);
  return totalMinutes;
}

function parseBusinessTimeLogMessage(message) {
  const text = collectEmbedTextForBusinessTimeLog(message);
  if (!text || !text.toLowerCase().includes("business zeitstempel")) return null;

  const employeeMatch = text.match(/Der\s+Mitarbeiter\s+(.+?)\s*\(ID:\s*(\d+)\)\s+hat\s+sich\s+(eingestempelt|ausgestempelt)/i);
  if (!employeeMatch) return null;

  const durationMatch = text.match(/Dauer:\s*([^\n]+)/i);
  const action = employeeMatch[3].toLowerCase();
  const durationText = durationMatch ? durationMatch[1].trim() : null;

  return {
    messageId: message.id,
    channelId: message.channelId,
    employeeName: employeeMatch[1].trim(),
    businessId: employeeMatch[2].trim(),
    action,
    durationText,
    durationMinutes: action === "ausgestempelt" ? parseBusinessDurationToMinutes(durationText) : null,
    rawText: text.slice(0, 1500),
  };
}

async function importBusinessTimeFromLog(parsed, linkedUser) {
  if (!parsed || !linkedUser) return { ok: false, reason: "missing_data" };

  if (parsed.action !== "ausgestempelt") {
    return { ok: false, reason: "not_clock_out" };
  }

  const minutes = Number(parsed.durationMinutes || 0);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return { ok: false, reason: "invalid_duration" };
  }

  const db = await pool.connect();

  try {
    await db.query("BEGIN");

    const importRes = await db.query(
      `
      INSERT INTO business_time_imports (message_id, user_id, name, business_id, duration_minutes, duration_text, raw_text)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (message_id) DO NOTHING
      RETURNING message_id;
      `,
      [
        parsed.messageId,
        linkedUser.user_id,
        parsed.employeeName,
        parsed.businessId,
        minutes,
        parsed.durationText,
        parsed.rawText,
      ]
    );

    if (importRes.rowCount === 0) {
      await db.query("ROLLBACK");
      return { ok: false, reason: "already_imported" };
    }

    await db.query(
      `
      INSERT INTO employees (user_id, total_minutes, weekly_minutes, left_server)
      VALUES ($1, $2, $2, FALSE)
      ON CONFLICT (user_id)
      DO UPDATE SET
        total_minutes = employees.total_minutes + EXCLUDED.total_minutes,
        weekly_minutes = employees.weekly_minutes + EXCLUDED.weekly_minutes,
        left_server = FALSE;
      `,
      [linkedUser.user_id, minutes]
    );

    await db.query(
      `
      INSERT INTO work_sessions (user_id, started_at, ended_at, minutes, auto_clockout, corrected)
      VALUES ($1, NOW() - ($2::int * INTERVAL '1 minute'), NOW(), $2, FALSE, TRUE);
      `,
      [linkedUser.user_id, minutes]
    );

    await db.query("COMMIT");

    console.log("✅ Business-Zeit automatisch eingetragen:", {
      name: parsed.employeeName,
      userId: linkedUser.user_id,
      minutes,
      messageId: parsed.messageId,
    });

    return { ok: true, minutes };
  } catch (err) {
    await db.query("ROLLBACK").catch(() => null);
    console.error("❌ Business-Zeit konnte nicht importiert werden:", err);
    return { ok: false, reason: "db_error", error: err };
  } finally {
    db.release();
  }
}

client.on("messageCreate", async (message) => {
  try {
    if (!message.guildId || message.channelId !== BUSINESS_TIME_LOG_CHANNEL_ID) return;

    const parsed = parseBusinessTimeLogMessage(message);

    console.log("📩 Neue Nachricht im Business-Zeitlog-Channel erkannt:", {
      messageId: message.id,
      authorId: message.author?.id,
      authorIsBot: Boolean(message.author?.bot),
      contentLength: message.content?.length || 0,
      embedCount: message.embeds?.length || 0,
      preview: collectEmbedTextForBusinessTimeLog(message).slice(0, 700),
    });

    if (!parsed) {
      console.log("⚠️ Business-Zeitlog konnte noch nicht geparst werden. Parser muss an das genaue Format angepasst werden.");
      return;
    }

    const linkedUser = await getBusinessUserLink(parsed.employeeName);

    console.log("✅ Business-Zeitlog erkannt:", {
      name: parsed.employeeName,
      businessId: parsed.businessId,
      action: parsed.action,
      durationText: parsed.durationText,
      durationMinutes: parsed.durationMinutes,
      linkedDiscordUserId: linkedUser?.user_id || null,
    });

    if (!linkedUser) {
      console.log(`ℹ️ Business-Name "${parsed.employeeName}" ist noch nicht verknüpft. Nutze /business-link user:@User name:${parsed.employeeName}`);
      return;
    }

    if (parsed.action !== "ausgestempelt") {
      console.log(`ℹ️ ${parsed.employeeName} hat sich eingestempelt. Zeit wird erst beim Ausstempeln übernommen.`);
      return;
    }

    const importResult = await importBusinessTimeFromLog(parsed, linkedUser);

    if (importResult.ok) {
      await updateTotalWorktimeMessage().catch((err) => console.error("⚠️ Gesamtzeit konnte nach Business-Import nicht aktualisiert werden:", err));
      await updateWeeklyWorktimeMessage().catch((err) => console.error("⚠️ Wochenzeit konnte nach Business-Import nicht aktualisiert werden:", err));
      await updateDashboardMessage().catch((err) => console.error("⚠️ Dashboard konnte nach Business-Import nicht aktualisiert werden:", err));
    } else {
      console.log("ℹ️ Business-Zeit wurde nicht eingetragen:", importResult.reason);
    }
  } catch (err) {
    console.error("❌ Fehler beim Business-Zeitlog-Scanner:", err);
  }
});

const BOT_STATUS_ROTATION = [
  "Made by Kquwi♱",
  "Anni stinkt 🫰",
  "Pearls Resort 🌴",
  "Wer das liest ist süß 🍭",
];

let statusRotationInterval = null;
let statusRotationIndex = 0;

function startStatusRotation() {
  if (!client.user) return;
  if (statusRotationInterval) clearInterval(statusRotationInterval);

  const applyStatus = () => {
    const status = BOT_STATUS_ROTATION[statusRotationIndex % BOT_STATUS_ROTATION.length];
    statusRotationIndex++;
    client.user.setActivity(status);
  };

  applyStatus();
  statusRotationInterval = setInterval(applyStatus, 5000);
}

let botStarted = false;

async function startBotOnce() {
  if (botStarted) {
    console.log("ℹ️ Ready-Event wurde erneut ausgelöst, Start wurde bereits ausgeführt.");
    return;
  }

  botStarted = true;

  console.log(`✅ Bot ist online als ${client.user?.tag || "Unbekannt"}`);

  try {
    if (client.user) {
      startStatusRotation();
    }

    await initDatabase();
    await registerCommands();
    await syncEmployeeRoles();
    await updateTotalWorktimeMessage();
    await updateWeeklyWorktimeMessage();
    await updateDashboardMessage();
    await updateWeeklyStatisticsMessage();
    await updateManagementTasksMessage();
    await sendStockCheckReminderIfNeeded(true);

    setInterval(checkReminders, 60 * 1000);
    setInterval(updateTotalWorktimeMessage, 2 * 60 * 1000);
    setInterval(updateWeeklyWorktimeMessage, 2 * 60 * 1000);
    setInterval(updateDashboardMessage, 2 * 60 * 1000);
    setInterval(updateWeeklyStatisticsMessage, 5 * 60 * 1000);
    setInterval(updateManagementTasksMessage, 5 * 60 * 1000);
    setInterval(sendStockCheckReminderIfNeeded, 60 * 1000);
    setInterval(weeklyResetOnly, 60 * 1000);
    setInterval(checkTicketCloseDeadlines, 60 * 1000);
    setInterval(checkWarningReviewReminders, 60 * 60 * 1000);

    console.log("✅ Stempel-Uhr System gestartet.");
  } catch (err) {
    console.error("❌ Fehler beim Start:", err);
  }
}

client.once("ready", startBotOnce);
client.once("clientReady", startBotOnce);

setTimeout(() => {
  if (!botStarted && client.isReady?.()) {
    console.log("ℹ️ Client ist bereits ready. Starte System über Fallback.");
    startBotOnce().catch((err) => console.error("❌ Ready-Fallback fehlgeschlagen:", err));
  }
}, 5000);

client.on("guildMemberRemove", async (member) => {
  await deleteEmployeeTimeData(member.id).catch((err) => console.error("❌ Member-Leave Zeitdaten löschen fehlgeschlagen:", err));
  await updateTotalWorktimeMessage().catch(() => null);
  await updateWeeklyWorktimeMessage().catch(() => null);
});

client.on("guildMemberAdd", async (member) => {
  const channel = await client.channels.fetch(WELCOME_CHANNEL_ID).catch(() => null);
  if (!channel) return;

  await channel.send(
    `Hey, ${member} herzlich willkommen im Pearls.🌴
` +
      `Bitte registriere dich im folgenden Channel: <#${REGISTRATION_CHANNEL_ID}>`
  );
});

client.on("guildMemberUpdate", async (oldMember, newMember) => {
  const hadRole = oldMember.roles.cache.has(EMPLOYEE_ROLE_ID);
  const hasRole = newMember.roles.cache.has(EMPLOYEE_ROLE_ID);

  const hadProbeRole = oldMember.roles.cache.has(PROBE_ROLE_ID);
  const hasProbeRole = newMember.roles.cache.has(PROBE_ROLE_ID);

  if (!hadProbeRole && hasProbeRole) {
    await ensureEmployee(newMember.id);
    await query(`UPDATE employees SET left_server = FALSE WHERE user_id = $1`, [newMember.id]);
    await autoLinkBusinessNameFromMember(newMember, "Probe-Mitarbeiter-Rolle erhalten");
    await updateTotalWorktimeMessage();
    await updateWeeklyWorktimeMessage();
    console.log(`✅ ${newMember.user.tag} wurde durch Probezeit-Rolle in die Zeitliste aufgenommen.`);
  }

  if (!hadRole && hasRole) {
    await ensureEmployee(newMember.id);
    await query(`UPDATE employees SET left_server = FALSE WHERE user_id = $1`, [newMember.id]);
    await autoLinkBusinessNameFromMember(newMember, "Mitarbeiter-Rolle erhalten");
    await updateTotalWorktimeMessage();
    await updateWeeklyWorktimeMessage();
    console.log(`✅ ${newMember.user.tag} wurde als Mitarbeiter hinzugefügt.`);
  }

  const oldDisplayName = String(oldMember.nickname || oldMember.displayName || oldMember.user?.globalName || oldMember.user?.username || "");
  const newDisplayName = String(newMember.nickname || newMember.displayName || newMember.user?.globalName || newMember.user?.username || "");

  if ((hasProbeRole || hasRole) && oldDisplayName !== newDisplayName) {
    await autoLinkBusinessNameFromMember(newMember, "Nickname/Name geändert während Mitarbeiterrolle vorhanden ist");
  }

  if (hadRole && !hasRole) {
    await query(`UPDATE employees SET left_server = TRUE WHERE user_id = $1`, [newMember.id]);
    await query(`DELETE FROM active_sessions WHERE user_id = $1`, [newMember.id]);
    await newMember.roles.remove(DUTY_ROLE_ID).catch(() => {});
    await updateTotalWorktimeMessage();
    await updateWeeklyWorktimeMessage();
    console.log(`❌ ${newMember.user.tag} wurde aus den Listen entfernt.`);
  }
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const isTicketSlashCommand =
        interaction.commandName.startsWith("ticket-") || interaction.commandName === "ticketclose";

      if (!isTicketSlashCommand && isRestrictedCitizenCommandUser(interaction.member)) {
        return interaction.reply({
          content: "❌ Bürger können keine Bot-Commands benutzen.",
          ephemeral: true,
        });
      }

      if (interaction.commandName === "uhr") {
        if (!canCreatePanels(interaction.member)) {
          return interaction.reply({ content: "❌ Du darfst dieses Panel nicht erstellen.", ephemeral: true });
        }

        const embed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle("⏰ ・STEMPEL-UHR")
          .setDescription(
            "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
              "Starte oder beende hier deinen Dienst.\n\n" +
              "🟢 **Einstempeln**\n" +
              "└ Dienst starten und Arbeitszeit erfassen\n\n" +
              "🔴 **Ausstempeln**\n" +
              "└ Dienst beenden und Zeit speichern\n\n" +
              "⏸️ **Pause starten**\n" +
              "└ Arbeitszeit pausieren\n\n" +
              "▶️ **Pause beenden**\n" +
              "└ Arbeitszeit wieder fortsetzen\n" +
              "━━━━━━━━━━━━━━━━━━━━━━━━"
          )
          .setFooter({ text: "Pearls • Professionelles Arbeitszeitsystem" })
          .setTimestamp();

        return interaction.reply({ embeds: [embed], components: [clockButtons()] });
      }

      if (interaction.commandName === "mitarbeiterpanel") {
        const embed = new EmbedBuilder()
          .setColor(0xe67e22)
          .setTitle("👥 ・MITARBEITERPANEL")
          .setDescription(
            "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
              "Willkommen im Mitarbeiterbereich des **Pearls**.\n\n" +
              "❌ **Abmeldung**\n" +
              "└ Melde dich für einen Zeitraum ab\n\n" +
              "🍽️ **Essensstand/Event**\n" +
              "└ Stelle eine Anfrage für einen Stand oder ein Event\n\n" +
              "🛒 **Einkauf**\n" +
              "└ Trage ein, was benötigt wird\n\n" +
              "📋 **Bewerbung**\n" +
              "└ IC-Bewerbung einreichen\n\n" +
              "🚫 **Hausverbot**\n" +
              "└ Hausverbot dokumentieren\n" +
              "━━━━━━━━━━━━━━━━━━━━━━━━"
          )
          .setFooter({ text: "Pearls • Mitarbeiterverwaltung • Premium Design" })
          .setTimestamp();

        const row1 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("open_absence_modal").setLabel("Abmeldung").setEmoji("❌").setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId("open_request_menu").setLabel("Essensstand/Event").setEmoji("🍽️").setStyle(ButtonStyle.Primary)
        );

        const row2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("open_shopping_modal").setLabel("Einkauf").setEmoji("🛒").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("open_application_modal").setLabel("Bewerbung").setEmoji("📋").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("open_ban_modal").setLabel("Hausverbot").setEmoji("🚫").setStyle(ButtonStyle.Danger)
        );

        return interaction.reply({ embeds: [embed], components: [row1, row2] });
      }

      if (interaction.commandName === "managementpanel") {
        if (!canManagePersonal(interaction.member)) {
          return interaction.reply({ content: "❌ Du darfst dieses Panel nicht erstellen.", ephemeral: true });
        }

        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle("🛠️ ・MANAGEMENT PANEL")
          .setDescription(
            "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
              "Verwalte hier das Team des **Pearls**.\n\n" +
              "⚠️ **Verwarnung**\n" +
              "└ Normale Verwarnung ausstellen\n\n" +
              "🎉 **Teamupdate**\n" +
              "└ Beförderungen und Rollenänderungen\n\n" +
              "📤 **Kündigung**\n" +
              "└ Mitarbeiter aus Zeitlisten entfernen\n\n" +
              "🔄 **Verwarnung zurückziehen**\n" +
              "└ Aktive Verwarnung entfernen\n\n" +
              "🧠 **Einweisung**\n" +
              "└ Einweisung dokumentieren\n" +
              "━━━━━━━━━━━━━━━━━━━━━━━━"
          )
          .setFooter({ text: "Pearls • Managementsystem • Premium Design" })
          .setTimestamp();

        return interaction.reply({ embeds: [embed], components: managementPanelRows() });
      }

      if (interaction.commandName === "registrierungspanel") {
        if (!canCreatePanels(interaction.member)) {
          return interaction.reply({ content: "❌ Du darfst dieses Panel nicht erstellen.", ephemeral: true });
        }

        const embed = new EmbedBuilder()
          .setColor(0xf1c40f)
          .setTitle("📝 ・REGISTRIERUNG")
          .setDescription(
            "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
              "Registriere dich hier als Mitarbeiter des **Pearls**.\n\n" +
              "📌 **Bitte eintragen:**\n" +
              "└ Vorname\n" +
              "└ Nachname\n\n" +
              "✅ Nach der Registrierung erhältst du automatisch deine Rollen.\n" +
              "━━━━━━━━━━━━━━━━━━━━━━━━"
          )
          .setFooter({ text: "Pearls • Registrierungssystem • Premium Design" })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("open_registration_modal")
            .setLabel("Registrieren")
            .setEmoji("📝")
            .setStyle(ButtonStyle.Primary)
        );

        return interaction.reply({ embeds: [embed], components: [row] });
      }

      if (interaction.commandName === "ticketpanel") {
        if (!canCreatePanels(interaction.member)) {
          return interaction.reply({ content: "❌ Du darfst dieses Panel nicht erstellen.", ephemeral: true });
        }

        const embed = new EmbedBuilder()
          .setColor(0x5dade2)
          .setTitle("🎫 ・PEARLS TICKET-SYSTEM")
          .setDescription(
            "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
              "Wähle dein Anliegen aus und eröffne ein privates Ticket.\n\n" +
              "🏝️ **Bungalow buchen**\n" +
              "└ Für Reservierungen, Aufenthalte oder private Buchungen.\n\n" +
              "🍽️ **Essensstand buchen**\n" +
              "└ Für Events, Feiern oder besondere Veranstaltungen.\n\n" +
              "🎉 **Event-Anfrage**\n" +
              "└ Für größere Veranstaltungen oder Kooperationen.\n\n" +
              "❓ **Allgemeine Anfrage**\n" +
              "└ Für Fragen, Support oder sonstige Anliegen.\n" +
              "━━━━━━━━━━━━━━━━━━━━━━━━"
          )
          .setFooter({ text: "Pearls • Ticket-System" })
          .setTimestamp();

        return interaction.reply({ embeds: [embed], components: ticketPanelButtons() });
      }

      if (interaction.commandName === "ticket-add") {
        await interaction.deferReply({ ephemeral: false }).catch(() => null);

        if (!interaction.channel?.isThread?.()) {
          await interaction.editReply({ content: "❌ Dieser Command kann nur in einem Ticket-Thread genutzt werden." }).catch(() => null);
          return;
        }

        const ticket = await getOrRecoverTicketFromThread(interaction.channel);
        if (!ticket) {
          await interaction.editReply({ content: "❌ Dieser Thread ist kein bekanntes Ticket." }).catch(() => null);
          return;
        }

        if (!canUseTicketStaffCommands(interaction.member, ticket.category)) {
          await interaction.editReply({ content: "❌ Du darfst dieses Ticket nicht verwalten." }).catch(() => null);
          return;
        }

        const target = interaction.options.getUser("user", true);
        await unmarkTicketUserRemoved(interaction.channel.id, target.id).catch(() => null);

        try {
          await interaction.channel.members.add(target.id);
          await interaction.editReply({ content: `➕ <@${interaction.user.id}> hat ${target} zum Ticket hinzugefügt.` });
        } catch (err) {
          console.error(`❌ Konnte ${target.tag} nicht zum Ticket hinzufügen:`, err?.message || err);
          await interaction.editReply({ content: `❌ ${target} konnte nicht hinzugefügt werden. Prüfe Bot-Rechte und ob der User existiert.` }).catch(() => null);
        }
        return;
      }

      if (interaction.commandName === "ticket-remove") {
        await interaction.deferReply({ ephemeral: false }).catch(() => null);

        if (!interaction.channel?.isThread?.()) {
          await interaction.editReply({ content: "❌ Dieser Command kann nur in einem Ticket-Thread genutzt werden." }).catch(() => null);
          return;
        }

        const ticket = await getOrRecoverTicketFromThread(interaction.channel);
        if (!ticket) {
          await interaction.editReply({ content: "❌ Dieser Thread ist kein bekanntes Ticket." }).catch(() => null);
          return;
        }

        if (!canUseTicketStaffCommands(interaction.member, ticket.category)) {
          await interaction.editReply({ content: "❌ Du darfst dieses Ticket nicht verwalten." }).catch(() => null);
          return;
        }

        const target = interaction.options.getUser("user", true);
        if (target.id === ticket.opener_id) {
          await interaction.editReply({ content: "❌ Der Ticket-Ersteller kann nicht aus seinem eigenen Ticket entfernt werden." }).catch(() => null);
          return;
        }

        await markTicketUserRemoved(interaction.channel.id, target.id, interaction.user.id).catch((err) => {
          console.error("❌ Remove-Blocklist konnte nicht gespeichert werden:", err?.message || err);
        });

        await forceRemoveTicketMember(interaction.channel, target.id, `Dauerhaft aus Ticket entfernt von ${interaction.user.tag}`);
        await interaction.editReply({
          content:
            `➖ <@${interaction.user.id}> hat ${target} dauerhaft aus dem Ticket entfernt. ` +
            `Er wird nicht automatisch wieder hinzugefügt.`,
        }).catch(() => null);

        await sendTicketDebugLog(
          `🧹 **Ticket-Remove gesetzt**
` +
          `Thread: ${interaction.channel.name} (${interaction.channel.id})
` +
          `Entfernt: ${target.tag} (${target.id})
` +
          `Von: ${interaction.user.tag} (${interaction.user.id})`
        );
        return;
      }

      if (interaction.commandName === "ticket-rename") {
        await interaction.deferReply({ ephemeral: false });

        if (!interaction.channel?.isThread?.()) {
          await interaction.editReply({ content: "❌ Dieser Command kann nur in einem Ticket-Thread genutzt werden." });
          return;
        }

        const ticket = await getOrRecoverTicketFromThread(interaction.channel);
        if (!ticket) {
          await interaction.editReply({ content: "❌ Dieser Thread ist kein bekanntes Ticket." });
          return;
        }

        if (!canUseTicketStaffCommands(interaction.member, ticket.category)) {
          await interaction.editReply({ content: "❌ Du darfst dieses Ticket nicht umbenennen." });
          return;
        }

        const rawName = interaction.options.getString("name", true);
        const newName = formatRenamedTicketName(rawName, ticket.category);

        if (!newName || newName.length < 2) {
          await interaction.editReply({ content: "❌ Bitte gib einen gültigen Ticketnamen an." });
          return;
        }

        try {
          await interaction.channel.setName(newName, `Ticket umbenannt von ${interaction.user.tag}`);
        } catch (err) {
          console.error("❌ Ticket konnte nicht umbenannt werden:", err);
          await interaction.editReply({
            content: `❌ Das Ticket konnte nicht umbenannt werden. Bitte prüfe die Bot-Rechte. Fehler: \`${err?.code || "NO_CODE"}\``,
          });
          return;
        }

        await query(
          `UPDATE ticket_records SET current_name = $2, updated_at = NOW() WHERE thread_id = $1`,
          [interaction.channel.id, newName]
        ).catch((err) => console.error("❌ Ticket-Rename DB-Update fehlgeschlagen:", err));

        await interaction.editReply({ content: `✏️ <@${interaction.user.id}> hat das Ticket zu \`${newName}\` umbenannt.` });
        return;
      }

      if (interaction.commandName === "ticket-claim") {
        return claimTicket(interaction);
      }

      if (interaction.commandName === "ticket-close" || interaction.commandName === "ticketclose") {
        return requestTicketClose(interaction);
      }

      if (interaction.commandName === "ticket-open" || interaction.commandName === "ticketopen") {
        await interaction.deferReply({ ephemeral: true }).catch(() => null);

        try {
          const givenThreadId = interaction.options.getString("thread_id", false);
          const currentThread = interaction.channel?.isThread?.() ? interaction.channel : null;
          const threadId = givenThreadId || currentThread?.id;

          if (!threadId) {
            await interaction.editReply({
              content: "❌ Nutze den Command direkt im Ticket-Thread oder gib `thread_id:` an.",
            }).catch(() => null);
            return;
          }

          let ticket = await ticketTimeout(getTicketByThread(threadId), 8000, "Ticket aus Datenbank laden").catch((err) => {
            console.error("❌ Ticket-Open DB-Laden fehlgeschlagen:", err?.message || err);
            return null;
          });

          let thread = currentThread;

          if (!ticket) {
            thread = await fetchTicketThreadForOpen(threadId).catch(() => null);
            if (thread?.isThread?.()) {
              ticket = await ticketTimeout(getOrRecoverTicketFromThread(thread), 8000, "Ticket aus Thread wiederherstellen").catch((err) => {
                console.error("❌ Ticket-Open Recovery fehlgeschlagen:", err?.message || err);
                return null;
              });
            }
          }

          if (!ticket) {
            await interaction.editReply({
              content: "❌ Dieses Ticket wurde nicht in der Datenbank gefunden. Prüfe, ob die Thread-ID stimmt.",
            }).catch(() => null);
            return;
          }

          if (ticket.status === "deleted") {
            await interaction.editReply({
              content: "❌ Dieses Ticket ist bereits als gelöscht markiert und kann nicht mehr geöffnet werden.",
            }).catch(() => null);
            return;
          }

          if (!canUseTicketStaffCommands(interaction.member, ticket.category)) {
            await interaction.editReply({ content: "❌ Du darfst dieses Ticket nicht wieder öffnen." }).catch(() => null);
            return;
          }

          if (!thread?.isThread?.()) {
            thread = await fetchTicketThreadForOpen(threadId, ticket.category).catch(() => null);
          }

          if (!thread?.isThread?.()) {
            await interaction.editReply({
              content:
                "❌ Der Ticket-Thread konnte bei Discord nicht geladen werden. " +
                "Prüfe bitte, ob die Thread-ID stimmt und ob der Bot Zugriff auf den Ticket-Bereich hat.",
            }).catch(() => null);
            return;
          }

          const restoreName = getOpenTicketName(ticket, thread, getRestoreTicketName(ticket));

          await ticketTimeout(
            query(
              `
              UPDATE ticket_records
              SET status = 'open',
                  current_name = $2,
                  close_requested_by = NULL,
                  close_requested_at = NULL,
                  close_deadline_at = NULL,
                  close_message_id = NULL,
                  delete_after_at = NULL,
                  updated_at = NOW()
              WHERE thread_id = $1
              `,
              [threadId, restoreName]
            ),
            8000,
            "Ticket-Open DB-Update"
          ).catch((err) => console.error("❌ Ticket-Open DB-Update fehlgeschlagen:", err?.message || err));

          await interaction.editReply({
            content:
              `✅ Ticket wird wieder geöffnet.\n` +
              `Thread: <#${threadId}>\n` +
              `Ich entarchiviere/entsperre den Thread jetzt im Hintergrund und hole die Teammitglieder wieder rein.`,
          }).catch(() => null);

          scheduleTicketOpenFinalization(threadId, ticket, interaction.user.id, restoreName);
          return;
        } catch (err) {
          console.error("❌ Fehler bei /ticket-open:", err);
          await interaction.editReply({
            content: "❌ Beim Wiederöffnen ist ein Fehler passiert. Schau bitte in die Railway Logs.",
          }).catch(() => null);
          return;
        }
      }

      if (interaction.commandName === "business-link") {
        await interaction.deferReply({ ephemeral: true }).catch(() => null);

        if (!canManagePersonal(interaction.member)) {
          await interaction.editReply({ content: "❌ Du darfst Business-Namen nicht verknüpfen." }).catch(() => null);
          return;
        }

        const targetUser = interaction.options.getUser("user", true);
        const name = interaction.options.getString("name", true).trim().replace(/\s+/g, " ");

        if (!name || name.length < 2) {
          await interaction.editReply({ content: "❌ Bitte gib einen gültigen Namen an, genau wie er im Zeitstempel-Log steht." }).catch(() => null);
          return;
        }

        const saved = await upsertBusinessUserLink(targetUser.id, name, interaction.user.id).catch((err) => {
          console.error("❌ Business-Name-Link konnte nicht gespeichert werden:", err);
          return null;
        });

        if (!saved) {
          await interaction.editReply({ content: "❌ Die Verknüpfung konnte nicht gespeichert werden. Schau bitte in die Railway Logs." }).catch(() => null);
          return;
        }

        await interaction.editReply({
          content:
            "✅ **Business-Name verknüpft**\n\n" +
            `Name: **${saved.name}**\n` +
            `Discord-User: <@${saved.user_id}>\n\n` +
            "Die wechselnde Business-ID ist jetzt egal. Der Scanner erkennt den User über den Namen.",
        }).catch(() => null);
        return;
      }

      if (interaction.commandName === "business-links") {
        await interaction.deferReply({ ephemeral: true }).catch(() => null);

        if (!canManagePersonal(interaction.member)) {
          await interaction.editReply({ content: "❌ Du darfst Business-Verknüpfungen nicht ansehen." }).catch(() => null);
          return;
        }

        const links = await listBusinessUserLinks();

        if (!links.length) {
          await interaction.editReply({ content: "📭 Es gibt noch keine Business-Namen-Verknüpfungen. Nutze `/business-link`." }).catch(() => null);
          return;
        }

        const lines = links.map((link, index) => {
          return `${index + 1}. **${link.name}** → <@${link.user_id}>`;
        });

        await interaction.editReply({
          content:
            "📋 **Business-Namen-Verknüpfungen**\n\n" +
            lines.join("\n")
        }).catch(() => null);
        return;
      }

      if (interaction.commandName === "business-unlink") {
        await interaction.deferReply({ ephemeral: true }).catch(() => null);

        if (!canManagePersonal(interaction.member)) {
          await interaction.editReply({ content: "❌ Du darfst Business-Verknüpfungen nicht löschen." }).catch(() => null);
          return;
        }

        const name = interaction.options.getString("name", true).trim().replace(/\s+/g, " ");
        const deleted = await deleteBusinessUserLink(name);

        if (!deleted) {
          await interaction.editReply({ content: `⚠️ Für den Business-Namen **${name}** wurde keine Verknüpfung gefunden.` }).catch(() => null);
          return;
        }

        await interaction.editReply({
          content:
            "✅ **Business-Verknüpfung gelöscht**\n\n" +
            `Name: **${deleted.name}**\n` +
            `Vorheriger User: <@${deleted.user_id}>`,
        }).catch(() => null);
        return;
      }

      if (interaction.commandName === "dashboard") {
        if (!canManagePersonal(interaction.member)) {
          return interaction.reply({ content: "❌ Du darfst das Dashboard nicht aktualisieren.", ephemeral: true });
        }

        await updateDashboardMessage();
        return interaction.reply({ content: "✅ Dashboard wurde aktualisiert.", ephemeral: true });
      }

      if (interaction.commandName === "akte") {
        if (!canManagePersonal(interaction.member)) {
          return interaction.reply({ content: "❌ Du darfst keine Personalakten ansehen.", ephemeral: true });
        }

        const target = interaction.options.getUser("user");

        await interaction.deferReply({ ephemeral: true });

        await sendPersonalFileToChannel(target.id, interaction.user.id);

        return interaction.editReply({
          content: `✅ Personalakte von ${target} wurde in den Personalakten-Channel gesendet.`,
        });
      }

      if (interaction.commandName === "zeitpanel") {
        if (!canManagePersonal(interaction.member)) {
          return interaction.reply({ content: "❌ Du darfst dieses Panel nicht erstellen.", ephemeral: true });
        }

        const embed = new EmbedBuilder()
          .setColor(0x5dade2)
          .setTitle("🛠️ ・ZEITVERWALTUNG")
          .setDescription(
            "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
              "Verwalte hier die Arbeitszeiten von Mitarbeitern.\n\n" +
              "➕ **Zeit hinzufügen**\n" +
              "└ Erhöht Weekly und Gesamtzeit\n\n" +
              "➖ **Zeit entfernen**\n" +
              "└ Zieht Zeit von Weekly und Gesamtzeit ab\n\n" +
              "🔄 **Weekly setzen**\n" +
              "└ Setzt nur die aktuelle Weekly-Zeit\n\n" +
              "🏆 **Gesamtzeit setzen**\n" +
              "└ Setzt nur die Gesamtzeit\n\n" +
              "📊 **Zeiten ansehen**\n" +
              "└ Zeigt aktuelle Zeiten und letzte Änderungen\n" +
              "━━━━━━━━━━━━━━━━━━━━━━━━"
          )
          .setFooter({ text: "Pearls • Zeitverwaltung" })
          .setTimestamp();

        return interaction.reply({ embeds: [embed], components: timeManagementPanelRows() });
      }

      if (interaction.commandName === "mitarbeitercheck") {
        if (!canManagePersonal(interaction.member)) {
          return interaction.reply({ content: "❌ Du darfst keinen Mitarbeitercheck ausführen.", ephemeral: true });
        }

        const target = interaction.options.getUser("user");
        await interaction.deferReply({ ephemeral: true });

        const embed = await buildEmployeeCheckEmbed(target.id);
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (interaction.commandName === "personalnotiz") {
        if (!canManagePersonal(interaction.member)) {
          return interaction.reply({ content: "❌ Du darfst keine Personalnotizen erstellen.", ephemeral: true });
        }

        const target = interaction.options.getUser("user");
        const note = interaction.options.getString("notiz");

        await interaction.deferReply({ ephemeral: true });

        await query(
          `INSERT INTO personal_file_notes (user_id, issuer_id, note) VALUES ($1, $2, $3)`,
          [target.id, interaction.user.id, note]
        );

        await sendPersonalFileToChannel(target.id, interaction.user.id);

        return interaction.editReply({
          content: `✅ Notiz wurde zur Personalakte von ${target} hinzugefügt.`,
        });
      }

    }

    if (interaction.isUserSelectMenu()) {
      const id = interaction.customId;

      if (
        id === "time_add_user" ||
        id === "time_remove_user" ||
        id === "time_set_weekly_user" ||
        id === "time_set_total_user" ||
        id === "time_view_user"
      ) {
        if (!canManagePersonal(interaction.member)) {
          return interaction.reply({ content: "❌ Du darfst die Zeitverwaltung nicht nutzen.", ephemeral: true });
        }

        const targetUserId = interaction.values?.[0];

        if (!targetUserId) {
          return interaction.reply({ content: "❌ Es wurde kein Mitarbeiter ausgewählt.", ephemeral: true });
        }

        const actionMap = {
          time_add_user: "add",
          time_remove_user: "remove",
          time_set_weekly_user: "set_weekly",
          time_set_total_user: "set_total",
          time_view_user: "view",
        };

        const action = actionMap[id];

        if (action === "view") {
          const embed = await buildTimeOverviewEmbed(targetUserId);
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        timeManagementDrafts.set(interaction.user.id, {
          action,
          targetUserId,
        });

        const actionTexts = {
          add: "➕ Zeit hinzufügen",
          remove: "➖ Zeit entfernen",
          set_weekly: "🔄 Weekly-Zeit setzen",
          set_total: "🏆 Gesamtzeit setzen",
        };

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`time_open_modal_${action}`)
            .setLabel("Weiter")
            .setEmoji("➡️")
            .setStyle(ButtonStyle.Primary)
        );

        return interaction.reply({
          content: `${actionTexts[action]} für <@${targetUserId}> ausgewählt. Klicke jetzt auf **Weiter**.`,
          components: [row],
          ephemeral: true,
        });
      }

      const map = {
        mgmt_warning_user: "warning",
        mgmt_teamupdate_user: "teamupdate",
        mgmt_termination_user: "termination",
        mgmt_warning_remove_user: "warning_remove",
        mgmt_training_user: "training",
        mgmt_training_instructor: "training",
      };

      const type = map[id];
      if (!type) return;

      if (type?.startsWith("time_")) {
        const targetUserId = interaction.values?.[0];

        if (!targetUserId) {
          return interaction.reply({ content: "❌ Es wurde kein Mitarbeiter ausgewählt.", ephemeral: true });
        }

        const action = type.replace("time_", "");

        const draft = {
          action,
          targetUserId,
        };

        timeManagementDrafts.set(interaction.user.id, draft);

        if (type === "time_view") {
          const embed = await buildTimeOverviewEmbed(targetUserId);
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const actionTexts = {
          add: "➕ Zeit hinzufügen",
          remove: "➖ Zeit entfernen",
          set_weekly: "🔄 Weekly-Zeit setzen",
          set_total: "🏆 Gesamtzeit setzen",
        };

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`time_open_modal_${action}`)
            .setLabel("Weiter")
            .setEmoji("➡️")
            .setStyle(ButtonStyle.Primary)
        );

        return interaction.reply({
          content: `${actionTexts[action] || "Zeitverwaltung"} für <@${targetUserId}> ausgewählt. Klicke jetzt auf **Weiter**.`,
          components: [row],
          ephemeral: true,
        });
      }

      const key = draftKey(interaction.user.id, type);
      const draft = managementDrafts.get(key) || {};

      if (id === "mgmt_training_instructor") draft.instructorId = interaction.values[0];
      else draft.targetUserId = interaction.values[0];

      managementDrafts.set(key, draft);
      return interaction.reply({ content: "✅ Auswahl gespeichert.", ephemeral: true });
    }

    if (interaction.isStringSelectMenu()) {
      const id = interaction.customId;

      if (id === "mgmt_warning_role") {
        const key = draftKey(interaction.user.id, "warning");
        const draft = managementDrafts.get(key) || {};
        draft.warningRoleId = interaction.values[0];
        managementDrafts.set(key, draft);
        return interaction.reply({ content: "✅ Verwarnung gespeichert.", ephemeral: true });
      }

      if (id === "mgmt_warning_remove_role") {
        const key = draftKey(interaction.user.id, "warning_remove");
        const draft = managementDrafts.get(key) || {};
        draft.warningRoleId = interaction.values[0];
        managementDrafts.set(key, draft);
        return interaction.reply({ content: "✅ Verwarnung gespeichert.", ephemeral: true });
      }

      if (id === "mgmt_teamupdate_role") {
        const key = draftKey(interaction.user.id, "teamupdate");
        const draft = managementDrafts.get(key) || {};
        draft.updateType = interaction.values[0];
        managementDrafts.set(key, draft);
        return interaction.reply({ content: "✅ Teamupdate-Rolle gespeichert.", ephemeral: true });
      }
    }

    if (interaction.isButton()) {
      if (
        interaction.customId.startsWith("ticket_close_confirm_") ||
        interaction.customId.startsWith("ticket_close_cancel_") ||
        interaction.customId.startsWith("ticket_cancel_close_") ||
        interaction.customId.startsWith("ticket_close_abort_")
      ) {
        let closeToken = interaction.customId
          .replace("ticket_close_confirm_", "")
          .replace("ticket_close_cancel_", "")
          .replace("ticket_cancel_close_", "")
          .replace("ticket_close_abort_", "");

        const decision = interaction.customId.includes("confirm") ? "confirm" : "cancel";
        return handleTicketCloseDecision(interaction, closeToken, decision);
      }

      if (
        interaction.customId === "time_add_start" ||
        interaction.customId === "time_remove_start" ||
        interaction.customId === "time_set_weekly_start" ||
        interaction.customId === "time_set_total_start" ||
        interaction.customId === "time_view_start"
      ) {
        if (!canManagePersonal(interaction.member)) {
          return interaction.reply({ content: "❌ Du darfst die Zeitverwaltung nicht nutzen.", ephemeral: true });
        }

        const actionMap = {
          time_add_start: {
            selectId: "time_add_user",
            text: "➕ Wähle den Mitarbeiter aus, dem Zeit hinzugefügt werden soll.",
          },
          time_remove_start: {
            selectId: "time_remove_user",
            text: "➖ Wähle den Mitarbeiter aus, dem Zeit entfernt werden soll.",
          },
          time_set_weekly_start: {
            selectId: "time_set_weekly_user",
            text: "🔄 Wähle den Mitarbeiter aus, dessen Weekly-Zeit gesetzt werden soll.",
          },
          time_set_total_start: {
            selectId: "time_set_total_user",
            text: "🏆 Wähle den Mitarbeiter aus, dessen Gesamtzeit gesetzt werden soll.",
          },
          time_view_start: {
            selectId: "time_view_user",
            text: "📊 Wähle den Mitarbeiter aus, dessen Zeiten du ansehen möchtest.",
          },
        };

        const config = actionMap[interaction.customId];

        return interaction.reply({
          content: config.text,
          components: [timeUserSelect(config.selectId)],
          ephemeral: true,
        });
      }

      if (interaction.customId.startsWith("time_open_modal_")) {
        if (!canManagePersonal(interaction.member)) {
          return interaction.reply({ content: "❌ Du darfst die Zeitverwaltung nicht nutzen.", ephemeral: true });
        }

        const action = interaction.customId.replace("time_open_modal_", "");
        const draft = timeManagementDrafts.get(interaction.user.id);

        if (!draft?.targetUserId || draft.action !== action) {
          return interaction.reply({
            content: "❌ Deine Auswahl wurde nicht gefunden. Bitte starte die Zeitverwaltung neu.",
            ephemeral: true,
          });
        }

        const actionTitles = {
          add: "Zeit hinzufügen",
          remove: "Zeit entfernen",
          set_weekly: "Weekly-Zeit setzen",
          set_total: "Gesamtzeit setzen",
        };

        const modal = new ModalBuilder()
          .setCustomId(`time_manage_modal_${action}`)
          .setTitle(actionTitles[action] || "Zeitverwaltung");

        const amountInput = new TextInputBuilder()
          .setCustomId("time_amount")
          .setLabel("Zeit eingeben")
          .setPlaceholder("z. B. 1:30 oder 90")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const noteInput = new TextInputBuilder()
          .setCustomId("time_note")
          .setLabel("Notiz")
          .setPlaceholder("z. B. Korrektur / Nachtrag")
          .setStyle(TextInputStyle.Short)
          .setRequired(false);

        modal.addComponents(
          new ActionRowBuilder().addComponents(amountInput),
          new ActionRowBuilder().addComponents(noteInput)
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId === "mgmt_warning_start") {
        if (!canManagePersonal(interaction.member)) return interaction.reply({ content: "❌ Du darfst das nicht.", ephemeral: true });
        managementDrafts.set(draftKey(interaction.user.id, "warning"), {});
        return interaction.reply({
          content: "⚠️ Wähle den User und die Verwarnung aus. Danach auf **Weiter** klicken.",
          components: [userSelect("mgmt_warning_user", "User für Verwarnung auswählen"), warningRoleSelect("mgmt_warning_role"), continueButton("mgmt_warning_continue")],
          ephemeral: true,
        });
      }

      if (interaction.customId === "mgmt_teamupdate_start") {
        if (!canManagePersonal(interaction.member)) return interaction.reply({ content: "❌ Du darfst das nicht.", ephemeral: true });
        managementDrafts.set(draftKey(interaction.user.id, "teamupdate"), {});
        return interaction.reply({
          content: "🔄 Wähle den User und die neue Rolle/Änderung aus. Danach auf **Weiter** klicken.",
          components: [
            userSelect("mgmt_teamupdate_user", "User für Teamupdate auswählen"),
            teamUpdateRoleSelect("mgmt_teamupdate_role"),
            continueButton("mgmt_teamupdate_continue"),
          ],
          ephemeral: true,
        });
      }

      if (interaction.customId === "mgmt_termination_start") {
        if (!canManagePersonal(interaction.member)) return interaction.reply({ content: "❌ Du darfst das nicht.", ephemeral: true });
        managementDrafts.set(draftKey(interaction.user.id, "termination"), {});
        return interaction.reply({
          content: "📤 Wähle den User aus. Danach auf **Weiter** klicken.",
          components: [userSelect("mgmt_termination_user", "User für Kündigung auswählen"), continueButton("mgmt_termination_continue")],
          ephemeral: true,
        });
      }

      if (interaction.customId === "mgmt_warning_remove_start") {
        if (!canManagePersonal(interaction.member)) return interaction.reply({ content: "❌ Du darfst das nicht.", ephemeral: true });
        managementDrafts.set(draftKey(interaction.user.id, "warning_remove"), {});
        return interaction.reply({
          content: "🔄 Wähle den User und die Verwarnung aus. Danach auf **Weiter** klicken.",
          components: [userSelect("mgmt_warning_remove_user", "User auswählen"), warningRoleSelect("mgmt_warning_remove_role"), continueButton("mgmt_warning_remove_continue")],
          ephemeral: true,
        });
      }

      if (interaction.customId === "mgmt_training_start") {
        if (!canManagePersonal(interaction.member)) return interaction.reply({ content: "❌ Du darfst das nicht.", ephemeral: true });
        managementDrafts.set(draftKey(interaction.user.id, "training"), {});
        return interaction.reply({
          content: "🧠 Wähle Mitarbeiter und Einweiser aus. Danach auf **Weiter** klicken.",
          components: [userSelect("mgmt_training_user", "Mitarbeiter auswählen"), userSelect("mgmt_training_instructor", "Einweisung durch auswählen"), continueButton("mgmt_training_continue")],
          ephemeral: true,
        });
      }

      if (interaction.customId === "mgmt_warning_continue") {
        const draft = managementDrafts.get(draftKey(interaction.user.id, "warning"));
        if (!draft?.targetUserId || !draft?.warningRoleId) return interaction.reply({ content: "❌ Bitte User und Verwarnung auswählen.", ephemeral: true });

        const modal = new ModalBuilder().setCustomId("mgmt_warning_modal").setTitle("Verwarnung erstellen");
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("warning_reason").setLabel("Grund").setPlaceholder("Grund der Verwarnung").setStyle(TextInputStyle.Paragraph).setRequired(true)
          )
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId === "mgmt_teamupdate_continue") {
        const draft = managementDrafts.get(draftKey(interaction.user.id, "teamupdate"));
        if (!draft?.targetUserId || !draft?.updateType) {
          return interaction.reply({ content: "❌ Bitte User und Rolle/Änderung auswählen.", ephemeral: true });
        }

        await sendTeamUpdate(draft.targetUserId, draft.updateType, interaction.user.id);
        managementDrafts.delete(draftKey(interaction.user.id, "teamupdate"));
        return interaction.reply({ content: "✅ Teamupdate wurde gesendet und die Rolle wurde vergeben.", ephemeral: true });
      }

      if (interaction.customId === "mgmt_termination_continue") {
        const draft = managementDrafts.get(draftKey(interaction.user.id, "termination"));
        if (!draft?.targetUserId) return interaction.reply({ content: "❌ Bitte User auswählen.", ephemeral: true });

        const modal = new ModalBuilder().setCustomId("mgmt_termination_modal").setTitle("Kündigung erstellen");
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("termination_note").setLabel("Notiz").setPlaceholder("z. B. Eigenwunsch").setStyle(TextInputStyle.Paragraph).setRequired(true)
          )
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId === "mgmt_warning_remove_continue") {
        const draft = managementDrafts.get(draftKey(interaction.user.id, "warning_remove"));
        if (!draft?.targetUserId || !draft?.warningRoleId) return interaction.reply({ content: "❌ Bitte User und Verwarnung auswählen.", ephemeral: true });
        await sendWarningRemove(draft.targetUserId, draft.warningRoleId, interaction.user.id);
        managementDrafts.delete(draftKey(interaction.user.id, "warning_remove"));
        return interaction.reply({ content: "✅ Zurückgezogene Verwarnung wurde gesendet.", ephemeral: true });
      }

      if (interaction.customId === "mgmt_training_continue") {
        const draft = managementDrafts.get(draftKey(interaction.user.id, "training"));
        if (!draft?.targetUserId || !draft?.instructorId) return interaction.reply({ content: "❌ Bitte Mitarbeiter und Einweiser auswählen.", ephemeral: true });

        const modal = new ModalBuilder().setCustomId("mgmt_training_modal").setTitle("Einweisung dokumentieren");
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("training_date").setLabel("Datum").setPlaceholder("z. B. 12.05.2026").setStyle(TextInputStyle.Short).setRequired(true)
          )
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId === "weekly_prev" || interaction.customId === "weekly_next") {
        const current = Number(await getSetting("weekly_page", "0"));
        const next = interaction.customId === "weekly_next" ? current + 1 : current - 1;
        await setSetting("weekly_page", Math.max(0, next));
        await updateWeeklyWorktimeMessage();
        return interaction.reply({ content: "✅ Weekly Leaderboard aktualisiert.", ephemeral: true });
      }

      if (interaction.customId === "total_prev" || interaction.customId === "total_next") {
        const current = Number(await getSetting("total_page", "0"));
        const next = interaction.customId === "total_next" ? current + 1 : current - 1;
        await setSetting("total_page", Math.max(0, next));
        await updateTotalWorktimeMessage();
        return interaction.reply({ content: "✅ Gesamtzeiten aktualisiert.", ephemeral: true });
      }

      if (interaction.customId === "clock_in") {
        if (!interaction.member.roles.cache.has(EMPLOYEE_ROLE_ID)) {
          return interaction.reply({ content: "❌ Du kannst dich nur einstempeln, wenn du die Mitarbeiter-Rolle hast.", ephemeral: true });
        }

        await ensureEmployee(interaction.user.id);
        const existing = await query(`SELECT * FROM active_sessions WHERE user_id = $1`, [interaction.user.id]);

        if (existing.rows[0]) return interaction.reply({ content: "❌ Du bist bereits eingestempelt.", ephemeral: true });

        await query(`INSERT INTO active_sessions (user_id, started_at) VALUES ($1, NOW())`, [interaction.user.id]);
        await interaction.member.roles.add(DUTY_ROLE_ID).catch(() => {});
        await sendTimeLog("in", `<@${interaction.user.id}>`, "Dienst wurde gestartet.");
        await updateTotalWorktimeMessage();
        await updateWeeklyWorktimeMessage();
        await updateDashboardMessage().catch(() => null);

        return interaction.reply({ content: "✅ Du wurdest eingestempelt und hast die Im-Dienst-Rolle erhalten.", ephemeral: true });
      }

      if (interaction.customId === "clock_out") {
        const finished = await finishSession(interaction.user.id, false, new Date());
        if (!finished) return interaction.reply({ content: "❌ Du bist aktuell nicht eingestempelt.", ephemeral: true });
        return interaction.reply({ content: `✅ Du wurdest ausgestempelt. Gespeicherte Arbeitszeit: **${formatShortMinutes(finished.minutes)}**`, ephemeral: true });
      }

      if (interaction.customId === "pause_start") {
        const res = await query(`SELECT * FROM active_sessions WHERE user_id = $1`, [interaction.user.id]);
        const s = res.rows[0];

        if (!s) return interaction.reply({ content: "❌ Du bist nicht eingestempelt.", ephemeral: true });
        if (s.pause_started_at) return interaction.reply({ content: "❌ Du bist bereits in Pause.", ephemeral: true });

        await query(`UPDATE active_sessions SET pause_started_at = NOW() WHERE user_id = $1`, [interaction.user.id]);
        await sendTimeLog("pause", `<@${interaction.user.id}>`, "Pause wurde gestartet.");
        await updateWeeklyWorktimeMessage();

        return interaction.reply({ content: "⏸️ Pause gestartet. Deine Arbeitszeit läuft währenddessen nicht weiter.", ephemeral: true });
      }

      if (interaction.customId === "pause_end") {
        const res = await query(`SELECT * FROM active_sessions WHERE user_id = $1`, [interaction.user.id]);
        const s = res.rows[0];

        if (!s) return interaction.reply({ content: "❌ Du bist nicht eingestempelt.", ephemeral: true });
        if (!s.pause_started_at) return interaction.reply({ content: "❌ Du bist aktuell nicht in Pause.", ephemeral: true });

        const pauseMs = Date.now() - new Date(s.pause_started_at).getTime();

        await query(
          `
          UPDATE active_sessions
          SET pause_started_at = NULL,
              paused_ms = paused_ms + $2
          WHERE user_id = $1;
          `,
          [interaction.user.id, pauseMs]
        );

        await sendTimeLog("resume", `<@${interaction.user.id}>`, "Pause wurde beendet.");
        await updateWeeklyWorktimeMessage();

        return interaction.reply({ content: "▶️ Pause beendet. Deine Arbeitszeit läuft wieder weiter.", ephemeral: true });
      }

      if (interaction.customId.startsWith("confirm_active_")) {
        const userId = interaction.customId.replace("confirm_active_", "");

        if (interaction.user.id !== userId) {
          return interaction.reply({ content: "❌ Diese Aktivitätsprüfung ist nicht für dich.", ephemeral: true });
        }

        const res = await query(`SELECT * FROM active_sessions WHERE user_id = $1`, [userId]);
        const session = res.rows[0];

        if (!session) return interaction.reply({ content: "❌ Du bist nicht mehr eingestempelt.", ephemeral: true });

        await deleteReminderMessage(session);

        await query(
          `
          UPDATE active_sessions
          SET reminder_message_id = NULL,
              reminder_sent_at = NULL,
              reminder_deadline_at = NULL
          WHERE user_id = $1;
          `,
          [userId]
        );

        return interaction.reply({ content: "✅ Bestätigt. Du bleibst eingestempelt.", ephemeral: true });
      }

      if (interaction.customId.startsWith("correct_time_")) {
        const parts = interaction.customId.split("_");
        const sessionId = parts[2];
        const userId = parts[3];

        if (interaction.user.id !== userId && !canManagePersonal(interaction.member)) {
          return interaction.reply({ content: "❌ Du darfst diese Zeit nicht korrigieren.", ephemeral: true });
        }

        const modal = new ModalBuilder().setCustomId(`correct_time_modal_${sessionId}_${userId}`).setTitle("Arbeitszeit korrigieren");
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("corrected_time")
              .setLabel("Tatsächliche Arbeitszeit")
              .setPlaceholder("z. B. 1:30 oder 90")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId === "open_registration_modal") {
        const modal = new ModalBuilder().setCustomId("registration_modal").setTitle("Registrierung");
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("registration_firstname")
              .setLabel("Vorname")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("registration_lastname")
              .setLabel("Nachname")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );
        return interaction.showModal(modal);
      }

      if (interaction.customId.startsWith("ticket_open_")) {
        const categoryKey = interaction.customId.replace("ticket_open_", "");
        return createTicketFromButton(interaction, categoryKey);
      }

      if (interaction.customId === "ticket_claim") {
        return claimTicket(interaction);
      }

      if (interaction.customId === "ticket_request_close") {
        return requestTicketClose(interaction);
      }

      if (interaction.customId.startsWith("ticket_close_confirm_")) {
        const closeToken = interaction.customId.replace("ticket_close_confirm_", "");
        return handleTicketCloseDecision(interaction, closeToken, "confirm");
      }

      if (interaction.customId.startsWith("ticket_close_cancel_")) {
        const closeToken = interaction.customId.replace("ticket_close_cancel_", "");
        return handleTicketCloseDecision(interaction, closeToken, "cancel");
      }

      if (interaction.customId === "open_absence_modal") {
        const modal = new ModalBuilder().setCustomId("absence_modal").setTitle("Abmeldung erstellen");
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("absence_name").setLabel("Name").setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("absence_from").setLabel("Von").setPlaceholder("TT.MM.JJJJ").setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("absence_to").setLabel("Bis").setPlaceholder("TT.MM.JJJJ").setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("absence_reason").setLabel("Grund").setStyle(TextInputStyle.Paragraph).setRequired(true))
        );
        return interaction.showModal(modal);
      }

      if (interaction.customId === "open_request_menu") {
        const modal = new ModalBuilder().setCustomId("food_modal").setTitle("Essensstand/Event Anfrage");
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("food_name").setLabel("Essensstand/Event").setPlaceholder("z. B. Essensstand").setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("food_location").setLabel("Ort").setPlaceholder("z. B. Sandy Shores PLZ 3008").setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("food_time").setLabel("Uhrzeit").setPlaceholder("z. B. 18:00 - 21:00 Uhr").setStyle(TextInputStyle.Short).setRequired(true))
        );
        return interaction.showModal(modal);
      }

      if (interaction.customId === "open_shopping_modal") {
        const modal = new ModalBuilder().setCustomId("shopping_modal").setTitle("Einkauf eintragen");
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("shopping_items").setLabel("Was muss gekauft werden?").setStyle(TextInputStyle.Paragraph).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("shopping_amount").setLabel("Menge").setStyle(TextInputStyle.Short).setRequired(true))
        );
        return interaction.showModal(modal);
      }

      if (interaction.customId === "open_application_modal") {
        const modal = new ModalBuilder().setCustomId("application_modal").setTitle("IC-Bewerbung einreichen");
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("app_name").setLabel("IC Name").setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("app_age").setLabel("Alter").setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("app_phone").setLabel("Telefonnummer").setPlaceholder("z. B. 555-1234").setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("app_experience").setLabel("Erfahrung").setStyle(TextInputStyle.Paragraph).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("app_reason").setLabel("Warum möchtest du zu uns?").setStyle(TextInputStyle.Paragraph).setRequired(true))
        );
        return interaction.showModal(modal);
      }

      if (interaction.customId === "open_ban_modal") {
        const modal = new ModalBuilder().setCustomId("ban_modal").setTitle("Hausverbot eintragen");
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("ban_name").setLabel("Name").setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("ban_reason").setLabel("Grund").setStyle(TextInputStyle.Paragraph).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("ban_duration").setLabel("Dauer").setPlaceholder("z. B. 7 Tage / dauerhaft").setStyle(TextInputStyle.Short).setRequired(true))
        );
        return interaction.showModal(modal);
      }

      if (interaction.customId === "open_booking_modal" || interaction.customId === "open_bungalow_booking_modal") {
        const modal = new ModalBuilder().setCustomId("booking_modal").setTitle("Bungalow buchen");
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("booking_name").setLabel("Name / Gastname").setPlaceholder("z. B. Max Mustermann").setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("booking_phone").setLabel("Telefonnummer").setPlaceholder("z. B. 555-1234").setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("booking_timeframe").setLabel("Zeitraum").setPlaceholder("z. B. heute 20:00 - 22:00 Uhr").setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("booking_people").setLabel("Personenanzahl").setPlaceholder("z. B. 4 Personen").setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("booking_wish").setLabel("Bungalow / Wunsch / Notiz").setPlaceholder("z. B. Bungalow 2 oder besondere Wünsche").setStyle(TextInputStyle.Paragraph).setRequired(false))
        );
        return interaction.showModal(modal);
      }

      if (interaction.customId === "open_foodstand_booking_modal") {
        const modal = new ModalBuilder().setCustomId("foodstand_booking_modal").setTitle("Essensstand buchen");
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("booking_name").setLabel("Ansprechpartner / Name").setPlaceholder("z. B. Max Mustermann").setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("booking_phone").setLabel("Telefonnummer").setPlaceholder("z. B. 555-1234").setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("booking_timeframe").setLabel("Datum & Uhrzeit").setPlaceholder("z. B. Samstag 20:00 - 23:00 Uhr").setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("booking_people").setLabel("Personen / Gäste").setPlaceholder("z. B. ca. 20 Gäste").setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("booking_details").setLabel("Ort / Event / Wunsch / Notiz").setPlaceholder("z. B. Geburtstag am Strand, Essensstand mit Getränken").setStyle(TextInputStyle.Paragraph).setRequired(true))
        );
        return interaction.showModal(modal);
      }

      if (interaction.customId === "booking_confirm" || interaction.customId === "booking_deny") {
        if (!canCreatePanels(interaction.member)) return interaction.reply({ content: "❌ Du darfst Buchungen nicht bearbeiten.", ephemeral: true });

        const confirmed = interaction.customId === "booking_confirm";
        const oldEmbed = interaction.message.embeds[0];
        const status = confirmed ? `✅ Gebucht von <@${interaction.user.id}>` : `❌ Abgelehnt von <@${interaction.user.id}>`;
        const fields = replaceStatusField(oldEmbed, status);
        const changeIndex = fields.findIndex((f) => f.name === "Letzte Änderung");
        if (changeIndex >= 0) fields[changeIndex].value = `<@${interaction.user.id}> • <t:${Math.floor(Date.now() / 1000)}:R>`;

        const embed = EmbedBuilder.from(oldEmbed)
          .setColor(confirmed ? 0x2ecc71 : 0xe74c3c)
          .setFields(fields);

        await interaction.message.edit({ embeds: [embed], components: [] });

        if (confirmed) {
          const bookedChannel = await client.channels.fetch(BOOKING_CONFIRMED_CHANNEL_ID).catch(() => null);
          if (bookedChannel) {
            const isFoodstandBooking = (oldEmbed.title || "").toLowerCase().includes("essensstand");
            const bookedEmbed = EmbedBuilder.from(embed)
              .setTitle(isFoodstandBooking ? "✅ Essensstand wurde gebucht" : "✅ Bungalow wurde gebucht")
              .setFooter({ text: isFoodstandBooking ? "Pearls • Bestätigte Essensstand-Buchungen" : "Pearls • Bestätigte Bungalow-Buchungen" });
            await bookedChannel.send({ embeds: [bookedEmbed] });
          }
        }

        return interaction.reply({ content: confirmed ? "✅ Buchung wurde bestätigt und in den gebuchten Channel geschickt." : "❌ Buchung wurde abgelehnt.", ephemeral: true });
      }

      if (interaction.customId === "stock_checked") {
        if (!hasManagerRole(interaction.member)) {
          return interaction.reply({ content: "❌ Nur Manager können die Lagerprüfung bestätigen.", ephemeral: true });
        }

        await logStockCheck(interaction.message.id, interaction.user.id, "checked");

        const oldEmbed = interaction.message.embeds[0];
        const embed = EmbedBuilder.from(oldEmbed)
          .setColor(0x2ecc71)
          .setDescription(
            "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
              `✅ **Lager wurde geprüft.**\n\n` +
              `Bestätigt von: <@${interaction.user.id}>\n` +
              `Zeitpunkt: <t:${Math.floor(Date.now() / 1000)}:f>\n` +
              "━━━━━━━━━━━━━━━━━━━━━━━━"
          );

        await interaction.message.edit({ embeds: [embed], components: [] });
        return interaction.reply({ content: "✅ Lagerprüfung wurde gespeichert. Danke für die Rückmeldung.", ephemeral: true });
      }

      if (interaction.customId === "stock_shopping_needed") {
        if (!hasManagerRole(interaction.member)) {
          return interaction.reply({ content: "❌ Nur Manager können das bestätigen.", ephemeral: true });
        }

        const modal = new ModalBuilder()
          .setCustomId(`stock_shopping_modal_${interaction.message.id}`)
          .setTitle("Einkauf nötig");

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("stock_note")
              .setLabel("Was muss gekauft werden?")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
          )
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId === "stock_problem") {
        if (!hasManagerRole(interaction.member)) {
          return interaction.reply({ content: "❌ Nur Manager können ein Lagerproblem melden.", ephemeral: true });
        }

        const modal = new ModalBuilder()
          .setCustomId(`stock_problem_modal_${interaction.message.id}`)
          .setTitle("Lagerproblem melden");

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("stock_problem_note")
              .setLabel("Was ist das Problem?")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
          )
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId === "stand_close") {
        if (!canCreatePanels(interaction.member)) {
          return interaction.reply({ content: "❌ Du darfst diesen Stand nicht schließen.", ephemeral: true });
        }

        const closed = await closeActiveStandByMessage(interaction.message.id, interaction.user.id);
        if (!closed) {
          return interaction.reply({ content: "❌ Dieser Stand ist nicht mehr aktiv oder wurde nicht gefunden.", ephemeral: true });
        }

        return interaction.reply({ content: "✅ Der Stand wurde erfolgreich geschlossen und das Dashboard wurde aktualisiert.", ephemeral: true });
      }

      if (interaction.customId === "shopping_done" || interaction.customId === "shopping_open") {
        if (!canCreatePanels(interaction.member)) return interaction.reply({ content: "❌ Du darfst das nicht.", ephemeral: true });
        const status = interaction.customId === "shopping_done" ? "✅ Erledigt" : "🕒 Offen";
        const oldEmbed = interaction.message.embeds[0];
        const embed = EmbedBuilder.from(oldEmbed).setFields(replaceStatusField(oldEmbed, status));
        await interaction.message.edit({ embeds: [embed], components: [shoppingButtons()] });
        return interaction.reply({ content: `✅ Status geändert: ${status}`, ephemeral: true });
      }

      if (interaction.customId === "application_accept" || interaction.customId === "application_deny") {
        if (!canCreatePanels(interaction.member)) return interaction.reply({ content: "❌ Du darfst das nicht.", ephemeral: true });
        const status = interaction.customId === "application_accept" ? "✅ Angenommen" : "❌ Abgelehnt";
        const oldEmbed = interaction.message.embeds[0];
        const embed = EmbedBuilder.from(oldEmbed).setFields(replaceStatusField(oldEmbed, status));
        await interaction.message.edit({ embeds: [embed], components: [] });
        return interaction.reply({ content: `✅ Bewerbung wurde auf **${status}** gesetzt.`, ephemeral: true });
      }

      if (interaction.customId === "ban_active" || interaction.customId === "ban_expired") {
        if (!canCreatePanels(interaction.member)) return interaction.reply({ content: "❌ Du darfst das nicht.", ephemeral: true });
        const status = interaction.customId === "ban_active" ? "🚫 Aktiv" : "✅ Abgelaufen";
        const oldEmbed = interaction.message.embeds[0];
        const embed = EmbedBuilder.from(oldEmbed).setFields(replaceStatusField(oldEmbed, status));
        await interaction.message.edit({ embeds: [embed], components: [houseBanButtons()] });
        return interaction.reply({ content: `✅ Hausverbot Status geändert: ${status}`, ephemeral: true });
      }

      if (interaction.customId.startsWith("food_approve_") || interaction.customId.startsWith("food_deny_")) {
        if (!canCreatePanels(interaction.member)) return interaction.reply({ content: "❌ Du darfst das nicht.", ephemeral: true });

        const approved = interaction.customId.startsWith("food_approve_");
        const oldEmbed = interaction.message.embeds[0];
        const status = approved ? `✅ Bestätigt von <@${interaction.user.id}>` : `❌ Abgelehnt von <@${interaction.user.id}>`;
        const fields = replaceStatusField(oldEmbed, status);
        fields[fields.findIndex((f) => f.name === "Letzte Änderung")].value = `<t:${Math.floor(Date.now() / 1000)}:R>`;
        const embed = EmbedBuilder.from(oldEmbed).setColor(approved ? 0x2ecc71 : 0xe74c3c).setFields(fields);
        await interaction.message.edit({ embeds: [embed], components: [] });

        if (approved) {
          const standName = getField(oldEmbed, "Essensstand");
          const standLocation = getField(oldEmbed, "Ort");
          const standTime = getField(oldEmbed, "Uhrzeit");
          const creatorField = getField(oldEmbed, "Erstellt von");
          const creatorId = creatorField.replace(/\D/g, "") || interaction.user.id;

          await sendActiveStandMessage({
            requestMessageId: interaction.message.id,
            creatorId,
            name: standName,
            location: standLocation,
            time: standTime,
          }).catch((err) => console.error("❌ Aktiver Stand konnte nicht erstellt werden:", err));
        }

        return interaction.reply({ content: approved ? "✅ Anfrage bestätigt und als aktiver Stand eingetragen." : "❌ Anfrage abgelehnt.", ephemeral: true });
      }

      if (interaction.customId.startsWith("food_time_")) {
        if (!canCreatePanels(interaction.member)) return interaction.reply({ content: "❌ Du darfst das nicht.", ephemeral: true });
        const modal = new ModalBuilder().setCustomId(`food_time_modal_${interaction.message.id}`).setTitle("Uhrzeit ändern");
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("new_food_time").setLabel("Neue Uhrzeit").setStyle(TextInputStyle.Short).setRequired(true))
        );
        return interaction.showModal(modal);
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith("time_manage_modal_")) {
        if (!canManagePersonal(interaction.member)) {
          return interaction.reply({ content: "❌ Du darfst die Zeitverwaltung nicht nutzen.", ephemeral: true });
        }

        const action = interaction.customId.replace("time_manage_modal_", "");
        const draft = timeManagementDrafts.get(interaction.user.id);

        if (!draft?.targetUserId) {
          return interaction.reply({ content: "❌ Kein Mitarbeiter ausgewählt. Bitte starte die Zeitverwaltung neu.", ephemeral: true });
        }

        const rawTime = interaction.fields.getTextInputValue("time_amount");
        const note = interaction.fields.getTextInputValue("time_note") || null;
        const minutes = parseCorrectionTime(rawTime);

        if (minutes === null) {
          return interaction.reply({ content: "❌ Ungültiges Format. Nutze z. B. `1:30` oder `90`.", ephemeral: true });
        }

        const result = await applyManualTimeChange({
          targetUserId: draft.targetUserId,
          issuerId: interaction.user.id,
          action,
          minutes,
          note,
        });

        timeManagementDrafts.delete(interaction.user.id);

        const embed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle("✅ ・ZEIT ERFOLGREICH AKTUALISIERT")
          .setDescription(
            "━━━━━━━━━━━━━━━━━━━━━━━━\\n" +
              `👤 **Mitarbeiter**\\n└ <@${draft.targetUserId}>\\n\\n` +
              `🛠️ **Aktion**\\n└ ${timeActionLabel(action)}\\n\\n` +
              `🕒 **Zeit**\\n└ ${formatShortMinutes(minutes)}\\n\\n` +
              `📈 **Weekly-Zeit**\\n└ ${formatShortMinutes(result.oldWeekly)} → **${formatShortMinutes(result.newWeekly)}**\\n\\n` +
              `💎 **Gesamtzeit**\\n└ ${formatShortMinutes(result.oldTotal)} → **${formatShortMinutes(result.newTotal)}**\\n` +
              "━━━━━━━━━━━━━━━━━━━━━━━━"
          )
          .setFooter({ text: "Pearls • Zeitverwaltung" })
          .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (interaction.customId === "booking_modal") {
        const name = interaction.fields.getTextInputValue("booking_name");
        const phone = interaction.fields.getTextInputValue("booking_phone");
        const timeframe = interaction.fields.getTextInputValue("booking_timeframe");
        const people = interaction.fields.getTextInputValue("booking_people");
        const wish = interaction.fields.getTextInputValue("booking_wish") || "Keine Angabe";
        const requestId = `#${Date.now().toString().slice(-5)}`;

        const channel = await client.channels.fetch(BOOKING_REQUEST_CHANNEL_ID).catch(() => null);
        if (!channel) {
          return interaction.reply({ content: "❌ Buchungs-Channel wurde nicht gefunden.", ephemeral: true });
        }

        const embed = buildBookingEmbed({
          type: "bungalow",
          requestId,
          creatorId: interaction.user.id,
          name,
          phone,
          timeframe,
          people,
          wish,
        });

        await channel.send({ content: `<@&${MANAGER_ROLE_ID}>`, embeds: [embed], components: [bookingButtons()] });
        return interaction.reply({ content: "✅ Deine Bungalow-Buchung wurde gesendet.", ephemeral: true });
      }

      if (interaction.customId === "foodstand_booking_modal") {
        const name = interaction.fields.getTextInputValue("booking_name");
        const phone = interaction.fields.getTextInputValue("booking_phone");
        const timeframe = interaction.fields.getTextInputValue("booking_timeframe");
        const people = interaction.fields.getTextInputValue("booking_people");
        const details = interaction.fields.getTextInputValue("booking_details") || "Keine Angabe";
        const requestId = `#${Date.now().toString().slice(-5)}`;

        const channel = await client.channels.fetch(BOOKING_REQUEST_CHANNEL_ID).catch(() => null);
        if (!channel) {
          return interaction.reply({ content: "❌ Buchungs-Channel wurde nicht gefunden.", ephemeral: true });
        }

        const [locationRaw, ...wishParts] = details.split(";");
        const location = locationRaw?.trim() || "Siehe Notiz";
        const wish = wishParts.join(";").trim() || details;

        const embed = buildBookingEmbed({
          type: "foodstand",
          requestId,
          creatorId: interaction.user.id,
          name,
          phone,
          timeframe,
          people,
          location,
          wish,
        });

        await channel.send({ content: `<@&${MANAGER_ROLE_ID}>`, embeds: [embed], components: [bookingButtons()] });
        return interaction.reply({ content: "✅ Deine Essensstand-Buchung wurde gesendet.", ephemeral: true });
      }

      if (interaction.customId === "mgmt_warning_modal") {
        const draft = managementDrafts.get(draftKey(interaction.user.id, "warning"));
        if (!draft?.targetUserId || !draft?.warningRoleId) return interaction.reply({ content: "❌ Entwurf nicht gefunden. Bitte neu starten.", ephemeral: true });

        const reason = interaction.fields.getTextInputValue("warning_reason");
        await sendWarning(draft.targetUserId, draft.warningRoleId, reason, interaction.user.id);
        managementDrafts.delete(draftKey(interaction.user.id, "warning"));
        return interaction.reply({ content: "✅ Verwarnung wurde gesendet.", ephemeral: true });
      }

      if (interaction.customId === "mgmt_termination_modal") {
        const draft = managementDrafts.get(draftKey(interaction.user.id, "termination"));
        if (!draft?.targetUserId) return interaction.reply({ content: "❌ Entwurf nicht gefunden. Bitte neu starten.", ephemeral: true });

        const note = interaction.fields.getTextInputValue("termination_note");
        await sendTermination(draft.targetUserId, note, interaction.user.id);
        managementDrafts.delete(draftKey(interaction.user.id, "termination"));
        return interaction.reply({ content: "✅ Kündigung wurde gesendet.", ephemeral: true });
      }

      if (interaction.customId === "mgmt_training_modal") {
        const draft = managementDrafts.get(draftKey(interaction.user.id, "training"));
        if (!draft?.targetUserId || !draft?.instructorId) return interaction.reply({ content: "❌ Entwurf nicht gefunden. Bitte neu starten.", ephemeral: true });

        const date = interaction.fields.getTextInputValue("training_date");
        await sendTraining(draft.targetUserId, draft.instructorId, date, interaction.user.id);
        managementDrafts.delete(draftKey(interaction.user.id, "training"));
        return interaction.reply({ content: "✅ Einweisung wurde dokumentiert.", ephemeral: true });
      }

      if (interaction.customId.startsWith("correct_time_modal_")) {
        const parts = interaction.customId.split("_");
        const sessionId = parts[3];
        const userId = parts[4];
        const raw = interaction.fields.getTextInputValue("corrected_time");
        const correctedMinutes = parseCorrectionTime(raw);

        if (correctedMinutes === null) {
          return interaction.reply({ content: "❌ Ungültiges Format. Nutze z. B. `1:30` oder `90`.", ephemeral: true });
        }

        const old = await query(`SELECT minutes FROM work_sessions WHERE id = $1 AND user_id = $2`, [sessionId, userId]);
        if (!old.rows[0]) return interaction.reply({ content: "❌ Sitzung nicht gefunden.", ephemeral: true });

        const oldMinutes = old.rows[0].minutes;
        const diff = correctedMinutes - oldMinutes;

        await query(`UPDATE work_sessions SET minutes = $1, corrected = TRUE WHERE id = $2 AND user_id = $3`, [correctedMinutes, sessionId, userId]);
        await query(
          `UPDATE employees SET total_minutes = total_minutes + $2, weekly_minutes = weekly_minutes + $2 WHERE user_id = $1`,
          [userId, diff]
        );

        await updateTotalWorktimeMessage();
        await updateWeeklyWorktimeMessage();

        return interaction.reply({ content: `✅ Zeit korrigiert auf **${formatShortMinutes(correctedMinutes)}**.`, ephemeral: true });
      }

      if (interaction.customId === "registration_modal") {
        const firstName = formatName(interaction.fields.getTextInputValue("registration_firstname"));
        const lastName = formatName(interaction.fields.getTextInputValue("registration_lastname"));
        const fullName = `${firstName} ${lastName}`;

        let nicknameText = "";
        let roleText = "";

        try {
          await interaction.member.setNickname(fullName, "Registrierung über Bot");
          nicknameText = `✅ Nickname wurde auf **${fullName}** gesetzt.`;
        } catch (err) {
          console.error("❌ Nickname konnte nicht geändert werden:", err);
          nicknameText = "⚠️ Nickname konnte nicht geändert werden. Bitte Rollen-Hierarchie prüfen.";
        }

        const roleResult = await safeAddRoles(interaction.member, REGISTRATION_ROLE_IDS);
        await upsertBusinessUserLink(interaction.user.id, fullName, "REGISTRATION_MODAL").catch((err) => {
          console.error("❌ Business-Name konnte bei Registrierung nicht automatisch verknüpft werden:", err);
        });

        if (roleResult.failed.length > 0) {
          roleText =
            `
⚠️ Folgende Rollen konnten nicht vergeben werden: ` +
            roleResult.failed.map((id) => `<@&${id}>`).join(" + ");
        } else {
          roleText = "\n✅ Alle Registrierungsrollen wurden vergeben.";
        }

        return interaction.reply({
          content: `✅ Registrierung abgeschlossen.
${nicknameText}${roleText}`,
          ephemeral: true,
        });
      }

      if (interaction.customId === "absence_modal") {
        const name = interaction.fields.getTextInputValue("absence_name");
        const fromRaw = interaction.fields.getTextInputValue("absence_from");
        const toRaw = interaction.fields.getTextInputValue("absence_to");
        const reason = interaction.fields.getTextInputValue("absence_reason");

        const from = parseGermanDate(fromRaw);
        const to = parseGermanDate(toRaw);

        if (!from || !to || from > to) {
          return interaction.reply({ content: "❌ Bitte gib gültige Daten im Format TT.MM.JJJJ ein.", ephemeral: true });
        }

        await query(
          `INSERT INTO absences (user_id, name, date_from, date_to, reason) VALUES ($1, $2, $3, $4, $5)`,
          [interaction.user.id, name, from, to, reason]
        );

        const channel = await client.channels.fetch(ABSENCE_CHANNEL_ID);
        const embed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle("❌ Neue Abmeldung")
          .addFields(
            { name: "Name", value: name },
            { name: "Zeitraum", value: `${fromRaw} bis ${toRaw}` },
            { name: "Grund", value: reason },
            { name: "Erstellt von", value: `<@${interaction.user.id}>` }
          )
          .setTimestamp();

        await channel.send({ embeds: [embed] });
        return interaction.reply({ content: "✅ Abmeldung wurde eingetragen.", ephemeral: true });
      }

      if (interaction.customId === "food_modal") {
        const name = interaction.fields.getTextInputValue("food_name");
        const location = interaction.fields.getTextInputValue("food_location");
        const time = interaction.fields.getTextInputValue("food_time");
        const requestId = `#${Date.now().toString().slice(-5)}`;

        const channel = await client.channels.fetch(REQUEST_CHANNEL_ID);
        const embed = buildFoodEmbed({ name, location, time, requestId, creatorId: interaction.user.id });
        await channel.send({ content: `<@&${MANAGER_ROLE_ID}>`, embeds: [embed], components: [foodButtons(interaction.user.id)] });
        return interaction.reply({ content: "✅ Essensstand/Event-Anfrage wurde gesendet.", ephemeral: true });
      }

      if (interaction.customId.startsWith("food_time_modal_")) {
        const messageId = interaction.customId.replace("food_time_modal_", "");
        const newTime = interaction.fields.getTextInputValue("new_food_time");
        const oldEmbed = interaction.message?.embeds?.[0];

        if (!oldEmbed) return interaction.reply({ content: "❌ Nachricht konnte nicht bearbeitet werden.", ephemeral: true });

        const fields = oldEmbed.fields.map((f) => ({ name: f.name, value: f.value, inline: f.inline }));
        const timeIndex = fields.findIndex((f) => f.name === "Uhrzeit");
        const changeIndex = fields.findIndex((f) => f.name === "Letzte Änderung");

        if (timeIndex >= 0) fields[timeIndex].value = newTime;
        if (changeIndex >= 0) fields[changeIndex].value = `<@${interaction.user.id}> • <t:${Math.floor(Date.now() / 1000)}:R>`;

        const embed = EmbedBuilder.from(oldEmbed).setFields(fields);
        await interaction.message.edit({ embeds: [embed], components: interaction.message.components });
        return interaction.reply({ content: "✅ Uhrzeit wurde geändert.", ephemeral: true });
      }

      if (interaction.customId.startsWith("stock_shopping_modal_")) {
        const messageId = interaction.customId.replace("stock_shopping_modal_", "");
        const note = interaction.fields.getTextInputValue("stock_note");

        await logStockCheck(messageId, interaction.user.id, "shopping_needed", note);

        const shoppingChannel = await client.channels.fetch(SHOPPING_CHANNEL_ID).catch(() => null);
        if (shoppingChannel) {
          const embed = new EmbedBuilder()
            .setColor(0x5dade2)
            .setTitle("🛒 ・EINKAUF NACH LAGERPRÜFUNG")
            .setDescription(
              "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                `${note}\n\n` +
                `Gemeldet von: <@${interaction.user.id}>\n` +
                "━━━━━━━━━━━━━━━━━━━━━━━━"
            )
            .setTimestamp();

          await shoppingChannel.send({ embeds: [embed], components: [shoppingButtons()] });
        }

        const managerMsg = await interaction.channel.messages.fetch(messageId).catch(() => null);
        if (managerMsg) {
          const oldEmbed = managerMsg.embeds[0];
          const embed = EmbedBuilder.from(oldEmbed)
            .setColor(0x3498db)
            .setDescription(
              "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                `🛒 **Lager wurde geprüft – Einkauf nötig.**\n\n` +
                `Gemeldet von: <@${interaction.user.id}>\n` +
                `Notiz: ${note}\n` +
                `Zeitpunkt: <t:${Math.floor(Date.now() / 1000)}:f>\n` +
                "━━━━━━━━━━━━━━━━━━━━━━━━"
            );
          await managerMsg.edit({ embeds: [embed], components: [] }).catch(() => null);
        }

        return interaction.reply({ content: "✅ Einkauf wurde automatisch in die Einkaufsliste eingetragen.", ephemeral: true });
      }

      if (interaction.customId.startsWith("stock_problem_modal_")) {
        const messageId = interaction.customId.replace("stock_problem_modal_", "");
        const note = interaction.fields.getTextInputValue("stock_problem_note");

        await logStockCheck(messageId, interaction.user.id, "problem", note);

        const managerMsg = await interaction.channel.messages.fetch(messageId).catch(() => null);
        if (managerMsg) {
          const oldEmbed = managerMsg.embeds[0];
          const embed = EmbedBuilder.from(oldEmbed)
            .setColor(0xe74c3c)
            .setDescription(
              "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                `⚠️ **Lagerproblem gemeldet.**\n\n` +
                `Gemeldet von: <@${interaction.user.id}>\n` +
                `Problem: ${note}\n` +
                `Zeitpunkt: <t:${Math.floor(Date.now() / 1000)}:f>\n` +
                "━━━━━━━━━━━━━━━━━━━━━━━━"
            );
          await managerMsg.edit({ embeds: [embed], components: [] }).catch(() => null);
        }

        return interaction.reply({ content: "✅ Lagerproblem wurde gespeichert.", ephemeral: true });
      }

      if (interaction.customId === "shopping_modal") {
        const items = interaction.fields.getTextInputValue("shopping_items");
        const amount = interaction.fields.getTextInputValue("shopping_amount");
        const channel = await client.channels.fetch(SHOPPING_CHANNEL_ID);

        const embed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle("🛒 Neuer Einkauf")
          .addFields(
            { name: "Artikel", value: items },
            { name: "Menge", value: amount },
            { name: "Status", value: "🕒 Offen" },
            { name: "Erstellt von", value: `<@${interaction.user.id}>` }
          )
          .setTimestamp();

        await channel.send({ embeds: [embed], components: [shoppingButtons()] });
        return interaction.reply({ content: "✅ Einkauf wurde eingetragen.", ephemeral: true });
      }

      if (interaction.customId === "application_modal") {
        const name = interaction.fields.getTextInputValue("app_name");
        const age = interaction.fields.getTextInputValue("app_age");
        const phone = interaction.fields.getTextInputValue("app_phone");
        const experience = interaction.fields.getTextInputValue("app_experience");
        const reason = interaction.fields.getTextInputValue("app_reason");
        const channel = await client.channels.fetch(APPLICATION_CHANNEL_ID);

        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle("📋 Neue IC-Bewerbung")
          .addFields(
            { name: "Name", value: name },
            { name: "Alter", value: age },
            { name: "Telefonnummer", value: phone },
            { name: "Erfahrung", value: experience },
            { name: "Warum?", value: reason },
            { name: "Status", value: "🕒 Offen" },
            { name: "Eingereicht von", value: `<@${interaction.user.id}>` }
          )
          .setTimestamp();

        await channel.send({ content: `<@&${MANAGER_ROLE_ID}>`, embeds: [embed], components: [applicationButtons()] });
        return interaction.reply({ content: "✅ Bewerbung wurde eingereicht.", ephemeral: true });
      }

      if (interaction.customId === "ban_modal") {
        const name = interaction.fields.getTextInputValue("ban_name");
        const reason = interaction.fields.getTextInputValue("ban_reason");
        const duration = interaction.fields.getTextInputValue("ban_duration");
        const channel = await client.channels.fetch(HOUSE_BAN_CHANNEL_ID);

        const embed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle("🚫 Neues Hausverbot")
          .addFields(
            { name: "Name", value: name },
            { name: "Grund", value: reason },
            { name: "Dauer", value: duration },
            { name: "Status", value: "🚫 Aktiv" },
            { name: "Eingetragen von", value: `<@${interaction.user.id}>` }
          )
          .setTimestamp();

        await channel.send({ embeds: [embed], components: [houseBanButtons()] });
        return interaction.reply({ content: "✅ Hausverbot wurde eingetragen.", ephemeral: true });
      }
    }
  } catch (err) {
    console.error("❌ Fehler bei Interaction:", err);

    const payload = {
      content:
        "❌ **Es ist ein Fehler aufgetreten.**\n" +
        "Bitte versuche es kurz erneut. Falls es nochmal passiert, schick einen Screenshot und ggf. die Railway-Logs weiter.",
      ephemeral: true,
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(payload).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  }
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

console.log("🔑 Discord Login wird gestartet...");

client.login(TOKEN)
  .then(() => {
    console.log("✅ Discord Login erfolgreich angefragt. Warte auf Ready-Event...");
  })
  .catch((err) => {
    console.error("❌ Discord Login fehlgeschlagen:", err);
  });
