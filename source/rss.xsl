<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">

  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title><xsl:value-of select="rss/channel/title" /> - RSS</title>
        <style>
          body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;max-width:860px;margin:24px auto;padding:0 16px;line-height:1.6;color:#111;}
          h1{font-size:22px;margin:0 0 8px;}
          .meta{color:#666;font-size:14px;margin-bottom:16px;}
          .hint{background:#f6f8fa;border:1px solid #e5e7eb;border-radius:10px;padding:12px 14px;margin:16px 0;}
          ul{list-style:none;padding:0;margin:0;}
          li{padding:12px 0;border-top:1px solid #eee;}
          a{color:#0969da;text-decoration:none;}
          a:hover{text-decoration:underline;}
          .date{color:#666;font-size:12px;margin-top:4px;}
        </style>
      </head>
      <body>
        <h1>
          <a>
            <xsl:attribute name="href"><xsl:value-of select="rss/channel/link" /></xsl:attribute>
            <xsl:value-of select="rss/channel/title" />
          </a>
        </h1>
        <div class="meta">
          RSS 预览（用于浏览器阅读）。建议使用 RSS 阅读器订阅：
          <code><xsl:value-of select="rss/channel/atom:link/@href" /></code>
        </div>

        <div class="hint">
          <strong>提示：</strong>这是一个 RSS XML 文件的可读预览（XSL）。
          如果你看到的是原始 XML，请确认浏览器允许加载 XSL，或直接用 RSS 阅读器打开。
        </div>

        <h2>最近文章</h2>
        <ul>
          <xsl:for-each select="rss/channel/item">
            <li>
              <div>
                <a>
                  <xsl:attribute name="href"><xsl:value-of select="link" /></xsl:attribute>
                  <xsl:value-of select="title" />
                </a>
              </div>
              <div class="date"><xsl:value-of select="pubDate" /></div>
            </li>
          </xsl:for-each>
        </ul>
      </body>
    </html>
  </xsl:template>

</xsl:stylesheet>
