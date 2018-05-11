import INav from 'sfs-vue-ria/types/INav';

const clientNav: INav = {
  items: [
    {
      text: '推广管理',
      url: '/path1',
      include: /\/path1/,
    },
    {
      text: '表单',
      url: '/form',
    },
  ],
};

export default {
  client: clientNav,
};
