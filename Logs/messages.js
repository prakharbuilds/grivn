const { Events, EmbedBuilder, AttachmentBuilder } = require('discord.js');

const logChannelId = '1388100598880272494';

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    // Send an embed (and optional files) to the log channel
    const sendLog = async (embed, files = []) => {
      const logChannel = await client.channels.fetch(logChannelId).catch(() => null);
      if (logChannel?.isTextBased()) {
        await logChannel.send({ embeds: [embed], files });
      }
    };

    // Return "#channel in Category" or "#channel"
    const formatLocation = (channel) => {
      return channel.parent
        ? `#${channel.name} in **${channel.parent.name}**`
        : `#${channel.name}`;
    };

    // Handle edited messages
    client.on(Events.MessageUpdate, async (oldMsg, newMsg) => {
      if (
        oldMsg.partial || newMsg.partial ||
        !oldMsg.guild || oldMsg.author?.bot ||
        oldMsg.content === newMsg.content
      ) return;

      const location = formatLocation(oldMsg.channel);

      const embed = new EmbedBuilder()
        .setTitle('✏️ Message Edited')
        .setColor(0xffcc00)
        .setAuthor({ name: oldMsg.author.tag, iconURL: oldMsg.author.displayAvatarURL() })
        .addFields(
          { name: 'User', value: `<@${oldMsg.author.id}>`, inline: true },
          { name: 'Channel', value: `<#${oldMsg.channel.id}>`, inline: true },
          { name: 'Location', value: location },
          { name: 'Before', value: oldMsg.content?.slice(0, 1024) || '*No content*' },
          { name: 'After', value: newMsg.content?.slice(0, 1024) || '*No content*' },
          {
            name: 'Mentions',
            value: newMsg.mentions.users.map(u => `<@${u.id}>`).join(', ') || 'None',
          },
          {
            name: 'Jump to Message',
            value: `[Click here](https://discord.com/channels/${oldMsg.guild.id}/${oldMsg.channel.id}/${oldMsg.id})`
          }
        )
        .setTimestamp();

      const files = [];

      // Include any new attachments
      if (newMsg.attachments.size > 0) {
        for (const [, attachment] of newMsg.attachments) {
          files.push(new AttachmentBuilder(attachment.url));
        }
      }

      // Note embedded content if present
      if (newMsg.embeds.length > 0) {
        embed.addFields({
          name: 'Embeds',
          value: `🧩 This message contains ${newMsg.embeds.length} embed(s).`,
        });
      }

      sendLog(embed, files);
    });

    // Handle deleted messages
    client.on(Events.MessageDelete, async (msg) => {
      if (msg.partial || !msg.guild || msg.author?.bot) return;

      const location = formatLocation(msg.channel);

      const embed = new EmbedBuilder()
        .setTitle('🗑️ Message Deleted')
        .setColor(0xff0000)
        .setAuthor({ name: msg.author.tag, iconURL: msg.author.displayAvatarURL() })
        .addFields(
          { name: 'User', value: `<@${msg.author.id}>`, inline: true },
          { name: 'Channel', value: `<#${msg.channel.id}>`, inline: true },
          { name: 'Location', value: location },
          {
            name: 'Content',
            value: msg.content?.slice(0, 1024) || '*No content*',
          },
          {
            name: 'Mentions',
            value: msg.mentions.users.map(u => `<@${u.id}>`).join(', ') || 'None',
          }
        )
        .setTimestamp();

      const files = [];

      // Include any attachments
      if (msg.attachments.size > 0) {
        for (const [, attachment] of msg.attachments) {
          files.push(new AttachmentBuilder(attachment.url));
        }
      }

      // Note embedded content if present
      if (msg.embeds.length > 0) {
        embed.addFields({
          name: 'Embeds',
          value: `🧩 This message contained ${msg.embeds.length} embed(s).`,
        });
      }

      sendLog(embed, files);
    });
  }
};
