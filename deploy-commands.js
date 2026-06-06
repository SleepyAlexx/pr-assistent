if (process.env.NODE_ENV !== "production") require("dotenv").config();

const {
  REST,
  Routes,
  SlashCommandBuilder,
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN) {
  console.error("❌ DISCORD_TOKEN fehlt.");
  process.exit(1);
}

if (!CLIENT_ID) {
  console.error("❌ CLIENT_ID fehlt.");
  process.exit(1);
}

if (!GUILD_ID) {
  console.error("❌ GUILD_ID fehlt.");
  process.exit(1);
}

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
    .setName("ticket-open")
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
    .setName("zeitpanel")
    .setDescription("Sendet das Zeitverwaltungs-Panel."),
].map((cmd) => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function deployCommands() {
  try {
    console.log(`🔄 Registriere ${commands.length} Slash Commands für Guild ${GUILD_ID}...`);

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log(`✅ Slash Commands erfolgreich registriert: ${commands.length}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Fehler beim Registrieren der Slash Commands:");
    console.error(error);
    process.exit(1);
  }
}

deployCommands();
