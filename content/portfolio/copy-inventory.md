# 双语文案清单

依据：当前 Phase 1 英文数据、现有中文简历与已批准 spec。项目事实只保存在 shared.ts，旧src/data/portfolio.ts已在PB-10确认无调用者后退役；本清单保留内容溯源。

| 当前文件/内容 | 接入的数据或字典 | 保留原内容的例外 |
|---|---|---|
| Header / Footer | nav、a11y、sections.footerRights、当前语言 profile | 社交品牌名与 URL |
| Hero | profile、heroLines、sections.welcome/greeting、actions.contactMe、a11y.scrollAbout | 技术品牌与社交平台名 |
| About | profile.aboutDescription/focus、共享 stats、actions.downloadResume、对应语言 resumeHref | 两份已有 PDF 不改正文 |
| Skills | 共享 skills、skillCategories、sections.skills/skillsSubtitle | 技术名称、图标 slug |
| Qualifications | 共享教育/经历 ID 与年份，语言文件中的职位/公司/地点/日期/summary/highlights | Next Play Games 等品牌名、技术名称、指标数值 |
| Portfolio / Lab | 项目元数据与对应语言 ProjectText、actions.activeBadge/demo/source、sections.lab 等 | URL、技术栈、品牌名、年份、开关 |
| Contact | 共享联系方式、forms、errors | 用户输入原样；验证 token 不作为文案 |
| Chatbot | chat、a11y、errors | 已有消息原样，不因切语发送新请求 |
| UpdatesWidget | updates、a11y、errors，数量通过占位符注入 | Git commit message、SHA 原样 |
| BlogPage / BlogPreview / BlogCard | blog、actions、a11y | 9 篇文章标题、摘要、标签、正文与代码全部英文 |
| title / description / 社交分享 | seo.home/lab/blog，文章原标题/摘要 | 英文文章没有中文 alternate |

已核对：教育 2 项、经历 5 条（博世同一实习拆成两条项目线）、项目 10 项。所有项目的年份、图片、Demo/GitHub、技术栈和 Active 开关来自同一份元数据。

中文姓名、学校/学院、公司、职位和日期按中文简历核对；KnowHive 与 GoChatroom 亮点逐条对应当前英文数据。其他项目按已有英文说明翻译，不补充新指标。英文项目及经历描述保持原文。

日期展示格式可以不同，机器排序使用共享年份；RAGAS、P95、样本量保持原数值。最终页面仍需中文内容审阅，类型检查不能证明翻译准确。
