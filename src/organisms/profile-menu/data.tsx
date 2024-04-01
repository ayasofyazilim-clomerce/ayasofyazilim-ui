export const userNavigation = {
  username: 'Hello world',
  initials: 'HW',
  email: 'test@Test.com',
  imageURL: 'https://github.com/a0m0rajab.png',
  menuLinks: [
    {
      href: 'profile',
      text: 'Profile',
      shortcut: '⌘P',
    },
    {
      href: 'dashboard',
      text: 'Dashboard',
      shortcut: '⌘D',
    },
  ],
  logoutFunction: async () => {
    console.log('logout');
  },
};
