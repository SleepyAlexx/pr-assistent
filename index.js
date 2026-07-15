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
const APPLICATION_CHANNEL_ID = "1526789398035697745";
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
const MONEY_LOG_CHANNEL_ID = "1512314180752117935";


const BOOKING_REQUEST_CHANNEL_ID = "1512409329771221075";
const BOOKING_CONFIRMED_CHANNEL_ID = "1512409661029224488";


const TERMINATION_REMOVE_ROLE_IDS = [
  EMPLOYEE_ROLE_ID,
  TEAMUPDATE_EMPLOYEE_ROLE_ID,
  TEAMUPDATE_EMPLOYEE_BASE_ROLE_ID,
  PROBE_ROLE_ID,
  TEAMUPDATE_PROBE_EMPLOYEE_ROLE_ID,
  TEAMUPDATE_MANAGEMENT_BASE_ROLE_ID,
  TEAMUPDATE_MANAGER_ROLE_ID,
  TEAMUPDATE_PROBE_MANAGER_ROLE_ID,
  TEAMUPDATE_PERSONAL_MANAGER_ROLE_ID,
  TEAMUPDATE_CASINO_BASE_ROLE_ID,
  TEAMUPDATE_CASINO_EMPLOYEE_ROLE_ID,
];

const REGISTRATION_ROLE_IDS = [
  "1512314173844095170",
  "1512314173844095169",
  "1512314173844095175",
];

const TRACKED_EMPLOYEE_ROLE_IDS = [EMPLOYEE_ROLE_ID, PROBE_ROLE_ID];
const MANAGEMENT_TEAMUPDATE_ROLE_IDS = [
  TEAMUPDATE_PROBE_MANAGER_ROLE_ID,
  TEAMUPDATE_MANAGER_ROLE_ID,
  TEAMUPDATE_PERSONAL_MANAGER_ROLE_ID,
];

const ABSENCE_REVIEW_ROLE_IDS = [
  OWNER_ROLE_ID,
  CO_OWNER_ROLE_ID,
  PERSONAL_MANAGER_ROLE_ID,
  MANAGER_ROLE_ID,
  ...FULL_ACCESS_ROLE_IDS,
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
const serviceCorrectionDrafts = new Map();


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

function canReviewAbsence(member) {
  if (!member?.roles?.cache) return false;
  return ABSENCE_REVIEW_ROLE_IDS.some((roleId) => member.roles.cache.has(roleId));
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

  await query(`ALTER TABLE absences ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';`);
  await query(`ALTER TABLE absences ADD COLUMN IF NOT EXISTS reviewed_by TEXT;`);
  await query(`ALTER TABLE absences ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;`);
  await query(`ALTER TABLE absences ADD COLUMN IF NOT EXISTS message_id TEXT;`);

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

    new SlashCommandBuilder()
      .setName("dienst-korrektur")
      .setDescription("Korrigiert einen laufenden Dienst nach Crash oder Fehler.")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("Mitarbeiter auswählen")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("endzeit")
          .setDescription("Endzeit im Format HH:MM, z. B. 19:30")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("grund")
          .setDescription("Grund, z. B. Crash")
          .setRequired(true)
      ),
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

function absenceReviewButtons(absenceId, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`absence_approve_${absenceId}`)
      .setLabel("Genehmigt")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`absence_deny_${absenceId}`)
      .setLabel("Abgelehnt")
      .setEmoji("❌")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled)
  );
}

function formatAbsenceDate(value) {
  const dateKey = value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
  return formatGermanDateKey(dateKey);
}

function buildAbsenceEmbed(absence) {
  const status = absence.status || "pending";
  const reviewedAt = absence.reviewed_at
    ? `\n└ <t:${Math.floor(new Date(absence.reviewed_at).getTime() / 1000)}:R>`
    : "";

  let color = 0xf1c40f;
  let statusText = "🕒 **Offen**\n└ Wartet auf Genehmigung";

  if (status === "approved") {
    color = 0x2ecc71;
    statusText = `✅ **Genehmigt**\n└ Von <@${absence.reviewed_by}>${reviewedAt}`;
  }

  if (status === "denied") {
    color = 0xe74c3c;
    statusText = `❌ **Abgelehnt**\n└ Von <@${absence.reviewed_by}>${reviewedAt}`;
  }

  return new EmbedBuilder()
    .setColor(color)
    .setTitle("📋 ・ABMELDUNG")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
        `**${absence.name}** hat eine Abmeldung eingereicht.\n` +
        "━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .addFields(
      { name: "👤 **Name**", value: absence.name || "Nicht angegeben", inline: true },
      {
        name: "📅 **Zeitraum**",
        value: `**Von:** ${formatAbsenceDate(absence.date_from)}\n**Bis:** ${formatAbsenceDate(absence.date_to)}`,
        inline: true,
      },
      { name: "📝 **Grund**", value: absence.reason || "Nicht angegeben", inline: false },
      { name: "📨 **Eingereicht von**", value: `<@${absence.user_id}>`, inline: true },
      { name: "📌 **Status**", value: statusText, inline: true }
    )
    .setFooter({ text: "Pearls • Abmeldung" })
    .setTimestamp(absence.created_at ? new Date(absence.created_at) : new Date());
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
    new ButtonBuilder().setCustomId("mgmt_training_start").setLabel("Einweisung").setEmoji("🧠").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("mgmt_teamupdate_start").setLabel("Teamupdate").setEmoji("🔄").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("mgmt_termination_start").setLabel("Kündigung").setEmoji("📤").setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("mgmt_warning_start").setLabel("Verwarnung").setEmoji("⚠️").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("mgmt_warning_remove_start").setLabel("Verwarnung zurückziehen").setEmoji("✅").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("mgmt_time_start").setLabel("Zeitverwaltung").setEmoji("⏱️").setStyle(ButtonStyle.Secondary)
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

function buildTimeManagementPanelEmbed() {
  return new EmbedBuilder()
    .setColor(0x5dade2)
    .setTitle("⏱️ ・ZEITVERWALTUNG")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
        "Verwalte hier die Arbeitszeiten von Mitarbeitern.\n\n" +
        "➕ **Zeit hinzufügen**\n" +
        "└ Erhöht Weekly und Gesamtzeit\n\n" +
        "➖ **Zeit entfernen**\n" +
        "└ Zieht Zeit von Weekly und Gesamtzeit ab\n\n" +
        "📊 **Zeiten ansehen**\n" +
        "└ Zeigt aktuelle Zeiten und letzte Änderungen\n\n" +
        "🔄 **Weekly setzen**\n" +
        "└ Setzt nur die aktuelle Weekly-Zeit\n\n" +
        "🏆 **Gesamtzeit setzen**\n" +
        "└ Setzt nur die Gesamtzeit\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setFooter({ text: "Pearls • Zeitverwaltung" })
    .setTimestamp();
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

async function ensureRequiredCompanionRoles(member) {
  if (!member?.roles?.cache) return;

  const rolesToAdd = [];
  const hasEmployeeOrProbe = TRACKED_EMPLOYEE_ROLE_IDS.some((roleId) => member.roles.cache.has(roleId));
  const hasManagementTeamupdateRole = MANAGEMENT_TEAMUPDATE_ROLE_IDS.some((roleId) => member.roles.cache.has(roleId));

  if (hasEmployeeOrProbe && !member.roles.cache.has(TEAMUPDATE_EMPLOYEE_BASE_ROLE_ID)) {
    rolesToAdd.push(TEAMUPDATE_EMPLOYEE_BASE_ROLE_ID);
  }

  if (hasManagementTeamupdateRole) {
    if (!member.roles.cache.has(EMPLOYEE_ROLE_ID)) rolesToAdd.push(EMPLOYEE_ROLE_ID);
    if (!member.roles.cache.has(TEAMUPDATE_EMPLOYEE_BASE_ROLE_ID)) rolesToAdd.push(TEAMUPDATE_EMPLOYEE_BASE_ROLE_ID);
    if (!member.roles.cache.has(TEAMUPDATE_MANAGEMENT_BASE_ROLE_ID)) rolesToAdd.push(TEAMUPDATE_MANAGEMENT_BASE_ROLE_ID);
  }

  if (rolesToAdd.length) {
    await safeAddRoles(member, [...new Set(rolesToAdd)]);
  }
}

async function applyTeamUpdateRoles(targetMember, updateType) {
  let selectedRoleId = null;
  let roleIds = [];
  let removeRoleIds = [];

  if (updateType === "probe_employee") {
    selectedRoleId = TEAMUPDATE_PROBE_EMPLOYEE_ROLE_ID;
    roleIds = [selectedRoleId, TEAMUPDATE_EMPLOYEE_BASE_ROLE_ID];
  }

  if (updateType === "employee") {
    selectedRoleId = TEAMUPDATE_EMPLOYEE_ROLE_ID;
    roleIds = [selectedRoleId, TEAMUPDATE_EMPLOYEE_BASE_ROLE_ID];
    removeRoleIds = [TEAMUPDATE_PROBE_EMPLOYEE_ROLE_ID, PROBE_ROLE_ID];
  }

  if (updateType === "casino_employee") {
    selectedRoleId = TEAMUPDATE_CASINO_EMPLOYEE_ROLE_ID;
    roleIds = [selectedRoleId, TEAMUPDATE_CASINO_BASE_ROLE_ID];
  }

  if (updateType === "probe_manager") {
    selectedRoleId = TEAMUPDATE_PROBE_MANAGER_ROLE_ID;
    roleIds = [selectedRoleId, TEAMUPDATE_MANAGEMENT_BASE_ROLE_ID, EMPLOYEE_ROLE_ID, TEAMUPDATE_EMPLOYEE_BASE_ROLE_ID];
    removeRoleIds = [TEAMUPDATE_PROBE_EMPLOYEE_ROLE_ID, PROBE_ROLE_ID];
  }

  if (updateType === "manager") {
    selectedRoleId = TEAMUPDATE_MANAGER_ROLE_ID;
    roleIds = [selectedRoleId, TEAMUPDATE_MANAGEMENT_BASE_ROLE_ID, EMPLOYEE_ROLE_ID, TEAMUPDATE_EMPLOYEE_BASE_ROLE_ID];
    removeRoleIds = [TEAMUPDATE_PROBE_MANAGER_ROLE_ID, TEAMUPDATE_PROBE_EMPLOYEE_ROLE_ID, PROBE_ROLE_ID];
  }

  if (updateType === "personal_manager") {
    selectedRoleId = TEAMUPDATE_PERSONAL_MANAGER_ROLE_ID;
    roleIds = [selectedRoleId, TEAMUPDATE_MANAGEMENT_BASE_ROLE_ID, EMPLOYEE_ROLE_ID, TEAMUPDATE_EMPLOYEE_BASE_ROLE_ID];
    removeRoleIds = [TEAMUPDATE_PROBE_EMPLOYEE_ROLE_ID, PROBE_ROLE_ID];
  }

  if (!selectedRoleId || !roleIds.length) {
    throw new Error(`Unbekannter Teamupdate-Typ: ${updateType}`);
  }

  const addResult = await safeAddRoles(targetMember, roleIds);
  const removeResult = removeRoleIds.length
    ? await safeRemoveRoles(targetMember, removeRoleIds)
    : { removed: [], failed: [] };

  await ensureEmployee(targetMember.id).catch(() => null);
  await query(`UPDATE employees SET left_server = FALSE WHERE user_id = $1`, [targetMember.id]).catch(() => null);

  return {
    roleText: `<@&${selectedRoleId}>`,
    selectedRoleId,
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

async function getTrackedEmployeeIds() {
  const guild = await client.guilds.fetch(GUILD_ID).catch(() => null);
  if (!guild) return [];

  const members = await guild.members.fetch().catch(() => null);
  if (!members) return [];

  return [...members.values()]
    .filter((member) => TRACKED_EMPLOYEE_ROLE_IDS.some((roleId) => member.roles.cache.has(roleId)))
    .map((member) => member.id);
}

function asQueryRows(rows = []) {
  return { rows };
}

async function updateTotalWorktimeMessage() {
  const trackedIds = await getTrackedEmployeeIds();
  const result = trackedIds.length
    ? await query(`
        SELECT user_id, total_minutes AS minutes
        FROM employees
        WHERE left_server = FALSE
          AND user_id = ANY($1::text[])
        ORDER BY total_minutes DESC;
      `, [trackedIds])
    : asQueryRows([]);

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
    .setFooter({ text: `Nur Probe-Mitarbeiter & Mitarbeiter | Seite ${page + 1}/${totalPages}` })
    .setTimestamp();

  await sendOrUpdatePermanentMessage(TOTAL_WORKTIME_CHANNEL_ID, "total_worktime_message_id", {
    embeds: [embed],
    components: [leaderboardButtons("total", page, totalPages)],
  });
}

async function updateWeeklyWorktimeMessage() {
  const trackedIds = await getTrackedEmployeeIds();
  const result = trackedIds.length
    ? await query(`
        SELECT user_id, weekly_minutes AS minutes
        FROM employees
        WHERE left_server = FALSE
          AND user_id = ANY($1::text[])
        ORDER BY weekly_minutes DESC;
      `, [trackedIds])
    : asQueryRows([]);

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
    .setFooter({ text: `Nur Probe-Mitarbeiter & Mitarbeiter | Seite ${page + 1}/${totalPages}` })
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

  for (const member of members.values()) {
    const hasEmployeeOrProbe = TRACKED_EMPLOYEE_ROLE_IDS.some((roleId) => member.roles.cache.has(roleId));
    const hasManagementTeamupdateRole = MANAGEMENT_TEAMUPDATE_ROLE_IDS.some((roleId) => member.roles.cache.has(roleId));

    if (hasEmployeeOrProbe || hasManagementTeamupdateRole) {
      await ensureRequiredCompanionRoles(member).catch(() => null);
      await ensureEmployee(member.id);
      await query(`UPDATE employees SET left_server = FALSE WHERE user_id = $1`, [member.id]);
      await autoLinkBusinessNameFromMember(member, "Rollen-Sync");
    }
  }

  for (const employee of employees.rows) {
    const member = members.get(employee.user_id);
    const isTracked = member
      ? TRACKED_EMPLOYEE_ROLE_IDS.some((roleId) => member.roles.cache.has(roleId))
      : false;

    await query(`UPDATE employees SET left_server = $2 WHERE user_id = $1`, [employee.user_id, !isTracked]);

    if (!isTracked) {
      await query(`DELETE FROM active_sessions WHERE user_id = $1`, [employee.user_id]);
      if (member) await member.roles.remove(DUTY_ROLE_ID).catch(() => {});
    }
  }

  await updateTotalWorktimeMessage();
  await updateWeeklyWorktimeMessage();
  console.log("✅ Mitarbeiter-/Probe-Mitarbeiter-Rollen wurden synchronisiert.");
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
  const trackedIds = await getTrackedEmployeeIds();
  const activeSessions = trackedIds.length
    ? await query(`SELECT user_id FROM active_sessions WHERE user_id = ANY($1::text[])`, [trackedIds])
    : asQueryRows([]);
  const activeWarnings = await query(`SELECT COUNT(*)::int AS count FROM warning_records WHERE active = TRUE`);
  const oldWarnings = await query(`
    SELECT COUNT(*)::int AS count
    FROM warning_records
    WHERE active = TRUE
      AND issued_at <= NOW() - INTERVAL '14 days'
  `);
  const activeStands = await query(`SELECT COUNT(*)::int AS count FROM active_stands WHERE status = 'active'`).catch(() => ({ rows: [{ count: 0 }] }));
  const employees = trackedIds.length
    ? await query(`
        SELECT COUNT(*)::int AS count, COALESCE(AVG(weekly_minutes), 0)::int AS avg_weekly
        FROM employees
        WHERE left_server = FALSE
          AND user_id = ANY($1::text[])
      `, [trackedIds])
    : asQueryRows([{ count: 0, avg_weekly: 0 }]);
  const weekAbsences = await query(`
    SELECT COUNT(*)::int AS count
    FROM absences
    WHERE date_from <= CURRENT_DATE + INTERVAL '7 days'
      AND date_to >= CURRENT_DATE
  `);

  const activeList = activeSessions.rows.length
    ? (await Promise.all(activeSessions.rows.map((r) => getCleanUserDisplay(r.user_id)))).join("\n").slice(0, 900)
    : "└ Niemand ist aktuell eingestempelt.";

  const taskText = Number(oldWarnings.rows[0]?.count || 0) > 0 || Number(weekAbsences.rows[0]?.count || 0) > 0
    ? "└ 🟡 Es gibt offene Punkte zum Prüfen."
    : "└ 🟢 Zurzeit sind keine offenen Prüfaufgaben vorhanden.";

  const embed = new EmbedBuilder()
    .setColor(0x5dade2)
    .setTitle("💠 ・PEARLS DASHBOARD")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
        "**Live-Übersicht für Management & Personal Management**\n" +
        "🟢 Alles gut • 🟡 Prüfen • 🔴 Handeln\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .addFields(
      {
        name: "👥 TEAM & ZEITEN",
        value:
          `👥 **Mitarbeiter im Team**\n└ ${employees.rows[0]?.count || 0}\n\n` +
          `🟢 **Aktuell im Dienst**\n└ ${activeSessions.rows.length}\n\n` +
          `📊 **Ø Wochenzeit pro Mitarbeiter**\n└ ${formatShortMinutes(employees.rows[0]?.avg_weekly || 0)}`,
      },
      {
        name: "👩‍💼 PERSONAL MANAGEMENT",
        value:
          `⚠️ **Aktive Verwarnungen**\n└ ${activeWarnings.rows[0]?.count || 0}\n\n` +
          `🕘 **Verwarnungen über 14 Tage**\n└ ${oldWarnings.rows[0]?.count || 0}\n\n` +
          `📅 **Abmeldungen diese Woche**\n└ ${weekAbsences.rows[0]?.count || 0}\n\n` +
          `📌 **OFFENE AUFGABEN**\n${taskText}`,
      },
      {
        name: "👨‍💼 MANAGEMENT",
        value:
          `🍽️ **Aktive Stände / Events**\n└ ${activeStands.rows[0]?.count || 0}\n\n` +
          "🛒 **Einkaufsliste**\n└ Bitte regelmäßig kontrollieren.\n\n" +
          "📦 **Lagerprüfung**\n└ Alle 2 Tage prüfen.",
      },
      {
        name: "🟢 EINGESTEMPELTE MITARBEITER",
        value: activeList,
      }
    )
    .setFooter({ text: "Pearls • Managementsystem • Live aktualisiert" })
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
  const trackedIds = await getTrackedEmployeeIds();

  const topWeekly = trackedIds.length
    ? await query(`
        SELECT user_id, weekly_minutes
        FROM employees
        WHERE left_server = FALSE
          AND user_id = ANY($1::text[])
        ORDER BY weekly_minutes DESC
        LIMIT 5
      `, [trackedIds])
    : asQueryRows([]);

  const topTotal = trackedIds.length
    ? await query(`
        SELECT user_id, total_minutes
        FROM employees
        WHERE left_server = FALSE
          AND user_id = ANY($1::text[])
        ORDER BY total_minutes DESC
        LIMIT 5
      `, [trackedIds])
    : asQueryRows([]);

  const activeWarnings = await query(`SELECT COUNT(*)::int AS count FROM warning_records WHERE active = TRUE`);
  const activeSessions = trackedIds.length
    ? await query(`SELECT COUNT(*)::int AS count FROM active_sessions WHERE user_id = ANY($1::text[])`, [trackedIds])
    : asQueryRows([{ count: 0 }]);
  const employeeStats = trackedIds.length
    ? await query(`
        SELECT COUNT(*)::int AS count, COALESCE(AVG(weekly_minutes), 0)::int AS avg_weekly
        FROM employees
        WHERE left_server = FALSE
          AND user_id = ANY($1::text[])
      `, [trackedIds])
    : asQueryRows([{ count: 0, avg_weekly: 0 }]);
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
    .setFooter({ text: "Pearls • Weekly Statistik • Nur Probe-Mitarbeiter & Mitarbeiter" })
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

async function setDutyRoleForUser(userId, enabled) {
  const guild = await client.guilds.fetch(GUILD_ID).catch(() => null);
  const member = await guild?.members.fetch(userId).catch(() => null);
  if (!member) return null;

  if (enabled) await member.roles.add(DUTY_ROLE_ID, "Automatische Dienst-Erkennung über IC-Foodbusiness").catch(() => null);
  else await member.roles.remove(DUTY_ROLE_ID, "Automatische Dienst-Erkennung über IC-Foodbusiness").catch(() => null);

  return member;
}

async function processBusinessClockInFromLog(parsed, linkedUser) {
  if (!parsed || !linkedUser) return { ok: false, reason: "missing_data" };

  await ensureEmployee(linkedUser.user_id);
  await query(`UPDATE employees SET left_server = FALSE WHERE user_id = $1`, [linkedUser.user_id]).catch(() => null);

  await query(
    `
    INSERT INTO active_sessions (user_id, started_at)
    VALUES ($1, NOW())
    ON CONFLICT (user_id) DO NOTHING;
    `,
    [linkedUser.user_id]
  );

  await query(
    `
    UPDATE active_sessions
    SET pause_started_at = NULL,
        reminder_message_id = NULL,
        reminder_sent_at = NULL,
        reminder_deadline_at = NULL
    WHERE user_id = $1;
    `,
    [linkedUser.user_id]
  ).catch(() => null);

  await setDutyRoleForUser(linkedUser.user_id, true);
  await sendTimeLog("in", `<@${linkedUser.user_id}>`, `Automatisch über IC-Foodbusiness erkannt.\n🧾 Name: **${parsed.employeeName}**`);
  await refreshAllTimeDisplays();

  return { ok: true };
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

    await db.query(`DELETE FROM active_sessions WHERE user_id = $1`, [linkedUser.user_id]);

    await db.query(
      `
      INSERT INTO work_sessions (user_id, started_at, ended_at, minutes, auto_clockout, corrected)
      VALUES ($1, NOW() - ($2::int * INTERVAL '1 minute'), NOW(), $2, FALSE, TRUE);
      `,
      [linkedUser.user_id, minutes]
    );

    await db.query("COMMIT");

    await setDutyRoleForUser(linkedUser.user_id, false);
    await sendTimeLog("out", `<@${linkedUser.user_id}>`, `Automatisch über IC-Foodbusiness erkannt.\n🕒 Gespeicherte Arbeitszeit: **${formatShortMinutes(minutes)}**\n🧾 Name: **${parsed.employeeName}**`);

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
    if (!message.guildId) return;

    if (message.channelId === MONEY_LOG_CHANNEL_ID) {
      console.log("💸 Geld-Log erkannt:", {
        messageId: message.id,
        channelId: message.channelId,
        preview: collectEmbedTextForBusinessTimeLog(message).slice(0, 500),
      });
      return;
    }

    if (message.channelId !== BUSINESS_TIME_LOG_CHANNEL_ID) return;

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

    if (parsed.action === "eingestempelt") {
      const result = await processBusinessClockInFromLog(parsed, linkedUser);
      if (!result.ok) console.log("ℹ️ Business-Einstempelung wurde nicht übernommen:", result.reason);
      return;
    }

    if (parsed.action === "ausgestempelt") {
      const importResult = await importBusinessTimeFromLog(parsed, linkedUser);

      if (importResult.ok) {
        await updateTotalWorktimeMessage().catch((err) => console.error("⚠️ Gesamtzeit konnte nach Business-Import nicht aktualisiert werden:", err));
        await updateWeeklyWorktimeMessage().catch((err) => console.error("⚠️ Wochenzeit konnte nach Business-Import nicht aktualisiert werden:", err));
        await updateDashboardMessage().catch((err) => console.error("⚠️ Dashboard konnte nach Business-Import nicht aktualisiert werden:", err));
      } else {
        console.log("ℹ️ Business-Zeit wurde nicht eingetragen:", importResult.reason);
      }
    }
  } catch (err) {
    console.error("❌ Fehler beim Business-Zeitlog-Scanner:", err);
  }
});

function formatGermanDateKey(dateKey) {
  const [year, month, day] = String(dateKey).split("-");
  return `${day}.${month}.${year}`;
}

function isPastDateKey(dateKey) {
  return String(dateKey) < getBerlinDateKey();
}

function getTimeZoneOffsetMs(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return asUTC - date.getTime();
}

function zonedTimeToDate(year, month, day, hour, minute, timeZone = "Europe/Berlin") {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offset = getTimeZoneOffsetMs(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offset);
}

function parseBerlinClockTimeToday(raw) {
  const match = String(raw || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  const p = getBerlinParts();
  return zonedTimeToDate(Number(p.year), Number(p.month), Number(p.day), hour, minute);
}

function dienstCorrectionButtons(correctionId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`dienst_correction_book_${correctionId}`)
      .setLabel("Buchen")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`dienst_correction_cancel_${correctionId}`)
      .setLabel("Abbrechen")
      .setEmoji("❌")
      .setStyle(ButtonStyle.Danger)
  );
}

async function applyDienstCorrection(draft) {
  const active = await query(`SELECT * FROM active_sessions WHERE user_id = $1`, [draft.targetUserId]);
  const session = active.rows[0];

  if (!session) {
    return { ok: false, reason: "not_active" };
  }

  const endAt = new Date(draft.endAt);
  const startedAt = new Date(session.started_at);

  if (endAt <= startedAt) {
    return { ok: false, reason: "end_before_start" };
  }

  if (endAt.getTime() > Date.now() + 60_000) {
    return { ok: false, reason: "future_time" };
  }

  const finished = await finishSession(draft.targetUserId, false, endAt);
  if (!finished) return { ok: false, reason: "finish_failed" };

  await query(
    `INSERT INTO personnel_events (user_id, issuer_id, event_type, details) VALUES ($1, $2, $3, $4)`,
    [draft.targetUserId, draft.issuerId, "Dienst-Korrektur", `Endzeit ${draft.endTimeRaw} • Grund: ${draft.reason}`]
  ).catch(() => null);

  const logChannel = await client.channels.fetch(TIME_LOG_CHANNEL_ID).catch(() => null);
  if (logChannel) {
    const embed = new EmbedBuilder()
      .setColor(0x5dade2)
      .setTitle("🛠️ ・DIENST-KORREKTUR GEBUCHT")
      .setDescription(
        "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
          `👤 **Mitarbeiter**\n└ <@${draft.targetUserId}>\n\n` +
          `🕒 **Endzeit**\n└ ${draft.endTimeRaw} Uhr\n\n` +
          `📌 **Grund**\n└ ${draft.reason}\n\n` +
          `📊 **Gebuchte Zeit**\n└ ${formatShortMinutes(finished.minutes)}\n\n` +
          `👮 **Gebucht von**\n└ <@${draft.issuerId}>\n` +
          "━━━━━━━━━━━━━━━━━━━━━━━━"
      )
      .setFooter({ text: "Pearls • Dienst-Korrektur" })
      .setTimestamp();

    await logChannel.send({ embeds: [embed] }).catch(() => null);
  }

  await refreshAllTimeDisplays();

  return { ok: true, minutes: finished.minutes };
}

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

    // Altes manuelles Aktivitäts-/Reminder-System ist deaktiviert. Dienstzeiten laufen über IC-Foodbusiness-Logs.
    setInterval(updateTotalWorktimeMessage, 2 * 60 * 1000);
    setInterval(updateWeeklyWorktimeMessage, 2 * 60 * 1000);
    setInterval(updateDashboardMessage, 2 * 60 * 1000);
    setInterval(updateWeeklyStatisticsMessage, 5 * 60 * 1000);
    setInterval(updateManagementTasksMessage, 5 * 60 * 1000);
    setInterval(sendStockCheckReminderIfNeeded, 60 * 1000);
    setInterval(weeklyResetOnly, 60 * 1000);
    setInterval(checkWarningReviewReminders, 60 * 60 * 1000);

    console.log("✅ Automatisches Dienstzeit-System gestartet.");
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
  const hadEmployeeRole = oldMember.roles.cache.has(EMPLOYEE_ROLE_ID);
  const hasEmployeeRole = newMember.roles.cache.has(EMPLOYEE_ROLE_ID);

  const hadProbeRole = oldMember.roles.cache.has(PROBE_ROLE_ID);
  const hasProbeRole = newMember.roles.cache.has(PROBE_ROLE_ID);

  const hadManagementRole = MANAGEMENT_TEAMUPDATE_ROLE_IDS.some((roleId) => oldMember.roles.cache.has(roleId));
  const hasManagementRole = MANAGEMENT_TEAMUPDATE_ROLE_IDS.some((roleId) => newMember.roles.cache.has(roleId));

  if (hasEmployeeRole || hasProbeRole || hasManagementRole) {
    await ensureRequiredCompanionRoles(newMember).catch((err) => console.error("❌ Zusatzrollen konnten nicht synchronisiert werden:", err));
    await ensureEmployee(newMember.id);
    await query(`UPDATE employees SET left_server = FALSE WHERE user_id = $1`, [newMember.id]);
    await autoLinkBusinessNameFromMember(newMember, "Mitarbeiter-/Managementrolle vorhanden");
  }

  if (!hadProbeRole && hasProbeRole) {
    console.log(`✅ ${newMember.user.tag} wurde durch Probe-Mitarbeiter-Rolle in die Zeitliste aufgenommen.`);
  }

  if (!hadEmployeeRole && hasEmployeeRole) {
    console.log(`✅ ${newMember.user.tag} wurde als Mitarbeiter hinzugefügt.`);
  }

  if (!hadManagementRole && hasManagementRole) {
    console.log(`✅ ${newMember.user.tag} wurde durch Management-Rolle als Mitarbeiter synchronisiert.`);
  }

  const oldDisplayName = String(oldMember.nickname || oldMember.displayName || oldMember.user?.globalName || oldMember.user?.username || "");
  const newDisplayName = String(newMember.nickname || newMember.displayName || newMember.user?.globalName || newMember.user?.username || "");

  if ((hasProbeRole || hasEmployeeRole || hasManagementRole) && oldDisplayName !== newDisplayName) {
    await autoLinkBusinessNameFromMember(newMember, "Nickname/Name geändert während Mitarbeiterrolle vorhanden ist");
  }

  const isStillTracked = hasProbeRole || hasEmployeeRole;
  if ((hadProbeRole || hadEmployeeRole) && !isStillTracked && !hasManagementRole) {
    await query(`UPDATE employees SET left_server = TRUE WHERE user_id = $1`, [newMember.id]);
    await query(`DELETE FROM active_sessions WHERE user_id = $1`, [newMember.id]);
    await newMember.roles.remove(DUTY_ROLE_ID).catch(() => {});
    console.log(`❌ ${newMember.user.tag} wurde aus den Listen entfernt.`);
  }

  await updateTotalWorktimeMessage().catch(() => null);
  await updateWeeklyWorktimeMessage().catch(() => null);
  await updateDashboardMessage().catch(() => null);
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {

      if (interaction.commandName === "uhr") {
        if (!canCreatePanels(interaction.member)) {
          return interaction.reply({ content: "❌ Du darfst dieses Panel nicht erstellen.", ephemeral: true });
        }

        const embed = new EmbedBuilder()
          .setColor(0x5dade2)
          .setTitle("⏱️ ・AUTOMATISCHE DIENSTZEIT")
          .setDescription(
            "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
              "Das alte manuelle Stempelsystem ist deaktiviert.\n\n" +
              "🟢 **Einstempeln**\n" +
              "└ Wird automatisch über die IC-Foodbusiness-Zeitstempel erkannt.\n\n" +
              "🔴 **Ausstempeln**\n" +
              "└ Zeit wird automatisch aus dem IC-Foodbusiness-Log übernommen.\n\n" +
              "🛠️ **Crash / Fehler**\n" +
              "└ Nutze `/dienst-korrektur`, um eine Endzeit sauber zu buchen.\n" +
              "━━━━━━━━━━━━━━━━━━━━━━━━"
          )
          .setFooter({ text: "Pearls • Automatisches Dienstzeitsystem" })
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
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
          new ButtonBuilder().setCustomId("open_shopping_modal").setLabel("Einkauf").setEmoji("🛒").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("open_application_modal").setLabel("Bewerbung").setEmoji("📋").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("open_ban_modal").setLabel("Hausverbot").setEmoji("🚫").setStyle(ButtonStyle.Danger)
        );

        return interaction.reply({ embeds: [embed], components: [row1] });
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
              "🧠 **Einweisung**\n" +
              "└ Einweisung dokumentieren\n\n" +
              "🔄 **Teamupdate**\n" +
              "└ Beförderungen und Rollenänderungen\n\n" +
              "📤 **Kündigung**\n" +
              "└ Mitarbeiter aus Zeitlisten entfernen\n\n" +
              "⚠️ **Verwarnung**\n" +
              "└ Normale Verwarnung ausstellen\n\n" +
              "✅ **Verwarnung zurückziehen**\n" +
              "└ Aktive Verwarnung entfernen\n\n" +
              "⏱️ **Zeitverwaltung**\n" +
              "└ Zeiten ansehen und korrigieren\n" +
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

      if (interaction.commandName === "dienst-korrektur") {
        if (!canManagePersonal(interaction.member)) {
          return interaction.reply({ content: "❌ Du darfst keine Dienstzeiten korrigieren.", ephemeral: true });
        }

        const target = interaction.options.getUser("user", true);
        const endTimeRaw = interaction.options.getString("endzeit", true).trim();
        const reason = interaction.options.getString("grund", true).trim();
        const endAt = parseBerlinClockTimeToday(endTimeRaw);

        if (!endAt) {
          return interaction.reply({ content: "❌ Bitte gib die Endzeit im Format `HH:MM` ein, z. B. `19:30`.", ephemeral: true });
        }

        if (endAt.getTime() > Date.now() + 60_000) {
          return interaction.reply({ content: "❌ Die Endzeit darf nicht in der Zukunft liegen.", ephemeral: true });
        }

        const active = await query(`SELECT started_at FROM active_sessions WHERE user_id = $1`, [target.id]);
        if (!active.rows[0]) {
          return interaction.reply({ content: `❌ ${target} ist aktuell nicht als im Dienst eingetragen.`, ephemeral: true });
        }

        if (endAt <= new Date(active.rows[0].started_at)) {
          return interaction.reply({ content: "❌ Die Endzeit liegt vor dem Dienstbeginn. Bitte prüfe die Uhrzeit.", ephemeral: true });
        }

        const correctionId = interaction.id;
        serviceCorrectionDrafts.set(correctionId, {
          targetUserId: target.id,
          issuerId: interaction.user.id,
          endAt: endAt.toISOString(),
          endTimeRaw,
          reason,
        });

        const embed = new EmbedBuilder()
          .setColor(0xf1c40f)
          .setTitle("🛠️ ・DIENST-KORREKTUR PRÜFEN")
          .setDescription(
            "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
              `👤 **Mitarbeiter**\n└ ${target}\n\n` +
              `🕒 **Endzeit**\n└ ${endTimeRaw} Uhr\n\n` +
              `📌 **Grund**\n└ ${reason}\n\n` +
              "Bitte bestätige, ob diese Korrektur gebucht werden soll.\n" +
              "━━━━━━━━━━━━━━━━━━━━━━━━"
          )
          .setFooter({ text: "Pearls • Dienst-Korrektur" })
          .setTimestamp();

        return interaction.reply({ embeds: [embed], components: [dienstCorrectionButtons(correctionId)], ephemeral: true });
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

        return interaction.reply({ embeds: [buildTimeManagementPanelEmbed()], components: timeManagementPanelRows() });
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
      if (interaction.customId === "mgmt_time_start") {
        if (!canManagePersonal(interaction.member)) {
          return interaction.reply({ content: "❌ Du darfst die Zeitverwaltung nicht nutzen.", ephemeral: true });
        }

        return interaction.reply({
          embeds: [buildTimeManagementPanelEmbed()],
          components: timeManagementPanelRows(),
          ephemeral: true,
        });
      }

      if (interaction.customId.startsWith("absence_approve_") || interaction.customId.startsWith("absence_deny_")) {
        if (!canReviewAbsence(interaction.member)) {
          return interaction.reply({
            content: "❌ Du darfst Abmeldungen nicht genehmigen oder ablehnen. Erlaubt sind Geschäftsführung, stellv. Geschäftsführung, Personal Managerin und Manager.",
            ephemeral: true,
          });
        }

        const approved = interaction.customId.startsWith("absence_approve_");
        const absenceId = Number(interaction.customId.replace(approved ? "absence_approve_" : "absence_deny_", ""));

        if (!absenceId || Number.isNaN(absenceId)) {
          return interaction.reply({ content: "❌ Diese Abmeldung konnte nicht erkannt werden.", ephemeral: true });
        }

        await interaction.deferUpdate();

        const current = await query(`SELECT * FROM absences WHERE id = $1`, [absenceId]);
        const oldAbsence = current.rows[0];

        if (!oldAbsence) {
          return interaction.followUp({ content: "❌ Diese Abmeldung wurde nicht mehr gefunden.", ephemeral: true });
        }

        if (oldAbsence.status && oldAbsence.status !== "pending") {
          const embed = buildAbsenceEmbed(oldAbsence);
          await interaction.message.edit({ embeds: [embed], components: [absenceReviewButtons(absenceId, true)] }).catch(() => null);
          return interaction.followUp({ content: "ℹ️ Diese Abmeldung wurde bereits bearbeitet.", ephemeral: true });
        }

        const newStatus = approved ? "approved" : "denied";
        const updated = await query(
          `
          UPDATE absences
          SET status = $2,
              reviewed_by = $3,
              reviewed_at = NOW(),
              message_id = COALESCE(message_id, $4)
          WHERE id = $1
          RETURNING *;
          `,
          [absenceId, newStatus, interaction.user.id, interaction.message.id]
        );

        const absence = updated.rows[0];
        const embed = buildAbsenceEmbed(absence);

        await interaction.message.edit({
          embeds: [embed],
          components: [absenceReviewButtons(absenceId, true)],
        });

        await updateDashboardMessage().catch(() => null);

        return interaction.followUp({
          content: approved ? "✅ Abmeldung wurde genehmigt." : "❌ Abmeldung wurde abgelehnt.",
          ephemeral: true,
        });
      }

      if (interaction.customId.startsWith("dienst_correction_book_") || interaction.customId.startsWith("dienst_correction_cancel_")) {
        const isBooking = interaction.customId.startsWith("dienst_correction_book_");
        const correctionId = interaction.customId.replace(isBooking ? "dienst_correction_book_" : "dienst_correction_cancel_", "");
        const draft = serviceCorrectionDrafts.get(correctionId);

        if (!draft) {
          return interaction.reply({ content: "❌ Diese Dienst-Korrektur ist nicht mehr verfügbar. Bitte den Command neu ausführen.", ephemeral: true });
        }

        if (interaction.user.id !== draft.issuerId && !canManagePersonal(interaction.member)) {
          return interaction.reply({ content: "❌ Du darfst diese Korrektur nicht bestätigen.", ephemeral: true });
        }

        if (!isBooking) {
          serviceCorrectionDrafts.delete(correctionId);
          return interaction.update({ content: "❌ Dienst-Korrektur wurde abgebrochen. Es wurde nichts gebucht.", embeds: [], components: [] });
        }

        const result = await applyDienstCorrection(draft);
        serviceCorrectionDrafts.delete(correctionId);

        if (!result.ok) {
          const reasons = {
            not_active: "Der Mitarbeiter ist nicht mehr im Dienst eingetragen.",
            end_before_start: "Die Endzeit liegt vor dem Dienstbeginn.",
            future_time: "Die Endzeit liegt in der Zukunft.",
            finish_failed: "Die Sitzung konnte nicht abgeschlossen werden.",
          };
          return interaction.update({
            content: `❌ Dienst-Korrektur konnte nicht gebucht werden: ${reasons[result.reason] || result.reason}`,
            embeds: [],
            components: [],
          });
        }

        return interaction.update({
          content: `✅ Dienst-Korrektur wurde gebucht. Gespeicherte Arbeitszeit: **${formatShortMinutes(result.minutes)}**`,
          embeds: [],
          components: [],
        });
      }

      if (["clock_in", "clock_out", "pause_start", "pause_end"].includes(interaction.customId)) {
        return interaction.reply({
          content: "ℹ️ Das alte manuelle Stempelsystem ist deaktiviert. Dienstzeiten werden automatisch über die IC-Foodbusiness-Zeitstempel erkannt. Nutze bei Crash bitte `/dienst-korrektur`.",
          ephemeral: true,
        });
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

        await interaction.deferReply({ ephemeral: true });
        await sendTeamUpdate(draft.targetUserId, draft.updateType, interaction.user.id);
        managementDrafts.delete(draftKey(interaction.user.id, "teamupdate"));
        return interaction.editReply({ content: "✅ Teamupdate wurde gesendet und die Rolle wurde vergeben." });
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

        await interaction.deferReply({ ephemeral: true });
        await sendWarningRemove(draft.targetUserId, draft.warningRoleId, interaction.user.id);
        managementDrafts.delete(draftKey(interaction.user.id, "warning_remove"));
        return interaction.editReply({ content: "✅ Zurückgezogene Verwarnung wurde gesendet." });
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

      if (interaction.customId === "open_absence_modal") {
        const defaultName = (cleanBusinessNameFromMember(interaction.member) || interaction.member?.displayName || interaction.user.username || "").slice(0, 100);
        const modal = new ModalBuilder().setCustomId("absence_modal").setTitle("Abmeldung erstellen");
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("absence_name")
              .setLabel("Name")
              .setValue(defaultName)
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
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
        await interaction.deferReply({ ephemeral: true });
        await sendWarning(draft.targetUserId, draft.warningRoleId, reason, interaction.user.id);
        managementDrafts.delete(draftKey(interaction.user.id, "warning"));
        return interaction.editReply({ content: "✅ Verwarnung wurde gesendet." });
      }

      if (interaction.customId === "mgmt_termination_modal") {
        const draft = managementDrafts.get(draftKey(interaction.user.id, "termination"));
        if (!draft?.targetUserId) return interaction.reply({ content: "❌ Entwurf nicht gefunden. Bitte neu starten.", ephemeral: true });

        const note = interaction.fields.getTextInputValue("termination_note");
        await interaction.deferReply({ ephemeral: true });
        await sendTermination(draft.targetUserId, note, interaction.user.id);
        managementDrafts.delete(draftKey(interaction.user.id, "termination"));
        return interaction.editReply({ content: "✅ Kündigung wurde gesendet." });
      }

      if (interaction.customId === "mgmt_training_modal") {
        const draft = managementDrafts.get(draftKey(interaction.user.id, "training"));
        if (!draft?.targetUserId || !draft?.instructorId) return interaction.reply({ content: "❌ Entwurf nicht gefunden. Bitte neu starten.", ephemeral: true });

        const date = interaction.fields.getTextInputValue("training_date");
        await interaction.deferReply({ ephemeral: true });
        await sendTraining(draft.targetUserId, draft.instructorId, date, interaction.user.id);
        managementDrafts.delete(draftKey(interaction.user.id, "training"));
        return interaction.editReply({ content: "✅ Einweisung wurde dokumentiert." });
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
        const name = formatName(interaction.fields.getTextInputValue("absence_name"));
        const fromRaw = interaction.fields.getTextInputValue("absence_from");
        const toRaw = interaction.fields.getTextInputValue("absence_to");
        const reason = interaction.fields.getTextInputValue("absence_reason");

        const from = parseGermanDate(fromRaw);
        const to = parseGermanDate(toRaw);

        if (!from || !to || from > to) {
          return interaction.reply({ content: "❌ Bitte gib gültige Daten im Format TT.MM.JJJJ ein. Das Bis-Datum darf nicht vor dem Von-Datum liegen.", ephemeral: true });
        }

        if (isPastDateKey(from) || isPastDateKey(to)) {
          return interaction.reply({ content: "❌ Vergangene Tage können nicht mehr für eine Abmeldung eingetragen werden.", ephemeral: true });
        }

        const inserted = await query(
          `
          INSERT INTO absences (user_id, name, date_from, date_to, reason, status)
          VALUES ($1, $2, $3, $4, $5, 'pending')
          RETURNING *;
          `,
          [interaction.user.id, name, from, to, reason]
        );

        const absence = inserted.rows[0];
        const channel = await client.channels.fetch(ABSENCE_CHANNEL_ID);
        const message = await channel.send({
          embeds: [buildAbsenceEmbed(absence)],
          components: [absenceReviewButtons(absence.id)],
        });

        await query(`UPDATE absences SET message_id = $2 WHERE id = $1`, [absence.id, message.id]).catch(() => null);
        await updateDashboardMessage().catch(() => null);
        return interaction.reply({ content: "✅ Abmeldung wurde eingereicht und wartet auf Genehmigung.", ephemeral: true });
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

        const msg = await channel.send({ content: `<@&${MANAGER_ROLE_ID}>`, embeds: [embed], components: [applicationButtons()] });

        await msg.startThread({
          name: `Bewerbung - ${name}`.slice(0, 100),
          autoArchiveDuration: 10080,
          reason: "Automatischer Bewerbungs-Thread",
        }).catch((err) => console.error("❌ Bewerbungs-Thread konnte nicht erstellt werden:", err));

        return interaction.reply({ content: "✅ Bewerbung wurde eingereicht und ein Bewerbungs-Thread wurde erstellt.", ephemeral: true });
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
