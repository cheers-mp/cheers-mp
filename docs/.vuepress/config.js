module.exports = {
  title: "Cheers-mp",
  description: "Almost 零配置小程序脚手架(゜-゜)つロ 干杯~",
  base: "/cheers-mp/",
  themeConfig: {
    repo: "bigmeow/cheers-mp",
    editLinks: true,
    // 默认为 "Edit this page"
    editLinkText: "帮助我们改善此页面！",
    smoothScroll: true,
    displayAllHeaders: true,
    sidebar: [
      {
        title: "介绍",
        path: "/introduce/",
        sidebarDepth: 3,
      },
      {
        title: "快速开始",
        sidebarDepth: 3,
        collapsable: false,
        children: ["/start/install", "/start/create"],
      },
      {
        title: "配置参考",
        path: "/config/",
      },
      {
        title: "CLI服务",
        path: "/cli-service/",
      },
    ],
  },
};
