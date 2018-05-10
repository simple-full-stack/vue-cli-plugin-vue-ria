import INav from 'sfs-vue-ria/types/INav';

const clientNav: INav = {
  items: [
    {
      text: '推广管理',
      url: '/path1',
      include: /\/path1/,
    },
  ],
};

export default {
  client: clientNav,
};
