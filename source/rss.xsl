<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/"
                xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title><xsl:value-of select="/rss/channel/title"/> RSS Feed</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
        <style type="text/css">
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; padding: 2rem 1rem; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 2rem; }
          .header h1 { margin-bottom: 0.5rem; color: #2c3e50; }
          .header p { color: #666; font-size: 1.1rem; }
          .header .subscribe { display: inline-block; background: #ea4c89; color: white; padding: 0.5rem 1rem; border-radius: 4px; text-decoration: none; margin-top: 1rem; font-weight: bold; }
          .post { border: 1px solid #eee; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
          .post h2 { margin-top: 0; margin-bottom: 0.5rem; font-size: 1.4rem; }
          .post h2 a { color: #3498db; text-decoration: none; }
          .post h2 a:hover { text-decoration: underline; }
          .post .meta { font-size: 0.9rem; color: #888; margin-bottom: 1rem; }
          .post .desc { font-size: 1rem; color: #444; }
          .notice { background: #fdfae5; padding: 1rem; border-radius: 4px; text-align: center; margin-bottom: 2rem; color: #8a6d3b; font-size: 0.95rem; }
        </style>
      </head>
      <body>
        <div class="notice">
          <strong>注意：</strong> 这是一个 RSS Feed。请复制当前 URL 并粘贴到您的 RSS 阅读器应用中订阅。
        </div>
        <div class="header">
          <h1><xsl:value-of select="/rss/channel/title"/></h1>
          <p><xsl:value-of select="/rss/channel/description"/></p>
          <a class="subscribe">
            <xsl:attribute name="href">
              <xsl:value-of select="/rss/channel/link"/>
            </xsl:attribute>
            访问博客主页
          </a>
        </div>
        <div class="posts">
          <xsl:for-each select="/rss/channel/item">
            <div class="post">
              <h2>
                <a target="_blank">
                  <xsl:attribute name="href">
                    <xsl:value-of select="link"/>
                  </xsl:attribute>
                  <xsl:value-of select="title"/>
                </a>
              </h2>
              <div class="meta">
                发布时间：<xsl:value-of select="pubDate"/>
              </div>
              <div class="desc">
                <xsl:value-of select="description" disable-output-escaping="yes"/>
              </div>
            </div>
          </xsl:for-each>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
