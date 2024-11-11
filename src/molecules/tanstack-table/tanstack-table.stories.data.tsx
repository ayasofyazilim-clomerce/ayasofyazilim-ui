import { PersonIcon, TrashIcon } from '@radix-ui/react-icons';
import { Building2, Edit, EyeIcon, KeyIcon } from 'lucide-react';
import { createZodObject } from 'src/lib/create-zod-object';
import { TanstackTableRowActionsType } from './types';
import { tanstackTableCreateColumnsByRowData } from './utils';

export type User = {
  createdAt?: Date;
  email: string;
  id: string;
  image: string;
  location: string;
  otherInformation?: string;
  phone: string;
  role: 'client' | 'provider';
  rtn?: string;
  status: 'active' | 'inactive';

  updatedAt?: Date;
  userName: string;
};

export const users: User[] = [
  {
    id: '9953ed85-31a0-4db9-acc8-e25b76176443',
    userName: 'John Miller',
    phone: '+1-555-0101',
    email: 'john.miller@example.com',
    role: 'client',
    status: 'inactive',
    location: '4306 Highland Drive, Seattle, WA 98109',
    image: 'john.miller.jpg',
    rtn: 'US2347908701',
    otherInformation: 'John Miller works in a tech startup in Seattle.',
    createdAt: new Date('2024-02-07T23:35:52.087Z'),
    updatedAt: new Date('2024-02-07T23:38:03.259Z'),
  },
  {
    id: '328c2bef-d84b-44a2-b5ae-03bd6550c4c4',
    userName: 'Elizabeth Smith',
    phone: '+44-020-8102',
    email: 'elizabeth.smith@example.co.uk',
    role: 'client',
    status: 'active',
    location: '22 Camden Road, London, NW1 9DP',
    image: 'elizabeth.smith.jpg',
    rtn: 'UK6574829302',
    otherInformation:
      'Elizabeth Smith works in a financial consultancy in London.',
    createdAt: new Date('2024-02-07T23:35:52.087Z'),
    updatedAt: new Date('2024-02-07T23:38:03.259Z'),
  },
  {
    id: '9543e3a4-99f2-4fcb-ba5d-f2aaebff6716',
    userName: 'Noah Wilson',
    phone: '+61-8-9200-1234',
    email: 'noah.wilson@example.com.au',
    role: 'provider',
    status: 'inactive',
    location: '305 Murray Street, Perth, WA 6000',
    image: 'noah.wilson.jpg',
    rtn: 'AU9085471203',
    otherInformation:
      'Noah Wilson is involved in the mining industry in Perth.',
    createdAt: new Date('2024-02-07T23:35:52.087Z'),
    updatedAt: new Date('2024-02-07T23:38:03.259Z'),
  },
  {
    id: 'bdcba306-57fa-4722-82e3-c4933b09e69b',
    userName: 'Marie Dubois',
    phone: '+33-1-4533-0012',
    email: 'marie.dubois@example.fr',
    role: 'client',
    status: 'active',
    location: '14 Rue de Rivoli, 75004 Paris',
    image: 'marie.dubois.jpg',
    rtn: 'FR21340987201',
    otherInformation: 'Marie Dubois works in a fashion house in Paris.',
    createdAt: new Date('2024-02-07T23:35:52.087Z'),
    updatedAt: new Date('2024-02-07T23:38:03.259Z'),
  },
  {
    id: 'e643dbea-0ab2-4d3d-8bb8-63aedf027a66',
    userName: 'Wang Wei',
    phone: '+86-20-8221-1234',
    email: 'wang.wei@example.com.cn',
    role: 'client',
    status: 'inactive',
    location: '206 Huanshi E Rd, Yuexiu District, Guangzhou, Guangdong',
    image: 'wang.wei.jpg',
    rtn: 'CN9988321221',
    otherInformation:
      'Wang Wei works for an electronics manufacturing company in Guangzhou.',
    createdAt: new Date('2024-02-07T23:35:52.087Z'),
    updatedAt: new Date('2024-02-07T23:38:03.259Z'),
  },
  {
    id: '94093200-c89f-410f-ba96-046f33fabb3e',
    userName: 'Conor Murphy',
    phone: '+353-1-242-1000',
    email: 'conor.murphy@example.ie',
    role: 'provider',
    status: 'active',
    location: "17 O'Connell Street, Dublin, D01 T9C2",
    image: 'conor.murphy.jpg',
    rtn: 'IE65432108701',
    otherInformation:
      'Conor Murphy works in a pharmaceutical company in Dublin.',
    createdAt: new Date('2024-02-07T23:35:52.087Z'),
    updatedAt: new Date('2024-02-07T23:38:03.259Z'),
  },
  {
    id: '4174f655-5cb2-4bd9-a785-ce11f16cebb0',
    userName: 'Emma Tremblay',
    phone: '+1 604-555-0122',
    email: 'emma.tremblay@example.com',
    role: 'client',
    status: 'inactive',
    location: '1020 Mainland Street, Vancouver, BC V6B 2T4',
    image: 'emma.tremblay.jpg',
    rtn: '07081999021280',
    otherInformation:
      'Emma Tremblay is engaged in the environmental sector in Canada.',
    createdAt: new Date('2024-02-13T15:35:02.010Z'),
    updatedAt: new Date('2024-02-13T15:37:03.020Z'),
  },
  {
    id: '38d5126b-4473-40d2-8142-2e7049c07346',
    userName: 'Maximilian Bauer',
    phone: '+49 30 567890',
    email: 'maximilian.bauer@example.com',
    role: 'client',
    status: 'active',
    location: 'Hauptstraße 5, 10178 Berlin',
    image: 'maximilian.bauer.jpg',
    rtn: '08081999021280',
    otherInformation:
      'Maximilian Bauer works for an automobile company in Germany.',
    createdAt: new Date('2024-02-14T16:39:04.030Z'),
    updatedAt: new Date('2024-02-14T16:40:05.040Z'),
  },
  {
    id: 'cb3ae8be-e376-4d26-9cfc-5884348c22ec',
    userName: 'Sofia Ricci',
    phone: '+39 06 12345678',
    email: 'sofia.ricci@example.com',
    role: 'provider',
    status: 'inactive',
    location: 'Via Roma 15, 00184 Rome',
    image: 'sofia.ricci.jpg',
    rtn: '09081999021280',
    otherInformation: 'Sofia Ricci is part of the culinary field in Italy.',
    createdAt: new Date('2024-02-15T17:41:06.050Z'),
    updatedAt: new Date('2024-02-15T17:42:07.060Z'),
  },
  {
    id: 'fa47c0f4-620c-40b3-a16a-b9afa9a88215',
    userName: 'Arjun Patel',
    phone: '+91 22 2771 1234',
    email: 'arjun.patel@example.com',
    role: 'client',
    status: 'active',
    location: '142 M.G. Road, Mumbai, Maharashtra 400001',
    image: 'arjun.patel.jpg',
    rtn: '10081999021280',
    otherInformation:
      'Arjun Patel is active in the software industry in India.',
    createdAt: new Date('2024-02-16T18:43:08.070Z'),
    updatedAt: new Date('2024-02-16T18:44:09.080Z'),
  },
  {
    id: '8ce5b4d9-5182-4cbf-9d48-f187b377e931',
    userName: 'Sato Yuki',
    phone: '+81 3 3541 1234',
    email: 'sato.yuki@example.com',
    role: 'client',
    status: 'inactive',
    location: '2-11-3 Meguro, Tokyo 153-0063',
    image: 'sato.yuki.jpg',
    rtn: '11081999021280',
    otherInformation:
      'Sato Yuki is engaged in the electronics sector in Japan.',
    createdAt: new Date('2024-02-17T19:45:10.090Z'),
    updatedAt: new Date('2024-02-17T19:46:11.100Z'),
  },
  {
    id: 'cb2c15c3-7fc9-4d51-8b7b-3e636ac6195b',
    userName: 'Lucas Silva',
    phone: '+55 11 9988-7766',
    email: 'lucas.silva@example.com',
    role: 'provider',
    status: 'active',
    location: 'Rua Oscar Freire, 379, São Paulo, SP 01426-001',
    image: 'lucas.silva.jpg',
    rtn: '12081999021280',
    otherInformation:
      'Lucas Silva works in the agricultural business in Brazil.',
    createdAt: new Date('2024-02-18T20:47:12.110Z'),
    updatedAt: new Date('2024-02-18T20:48:13.120Z'),
  },
];

export const col = tanstackTableCreateColumnsByRowData<User>({
  row: users[0],
  languageData: { userName: 'Kullanıcı Adı' },
  links: {
    userName: {
      targetAccessorKey: 'id',
      prefix: 'http://192.168.1.105:1453/tr/app/admin',
      suffix: '/edit',
    },
    email: {
      prefix: 'http://192.168.1.105:1453/tr/app/',
    },
  },
  faceted: {
    status: [
      { value: 'inactive', label: 'Inactive', icon: Building2 },
      { value: 'active', label: 'Active', icon: PersonIcon },
    ],
  },
});
const $schema = {
  required: ['displayName'],
  type: 'object',
  properties: {
    extraProperties: {
      type: 'object',
      additionalProperties: {},
      nullable: true,
      readOnly: true,
    },
    displayName: {
      maxLength: 128,
      minLength: 0,
      type: 'string',
    },
    concurrencyStamp: {
      type: 'string',
      nullable: true,
    },
  },
  additionalProperties: false,
} as const;

export const actions: TanstackTableRowActionsType<User>[] = [];

actions.push({
  cta: 'View User',
  icon: EyeIcon,
  type: 'link',
  onClick: (row) => {
    alert('Redirecting...');
    window.location.href = `/app/admin/users/${row.id}`;
  },
});
actions.push({
  type: 'autoform-dialog',
  cta: 'Edit',
  icon: Edit,
  submitText: 'Save',
  title: (row) => `Edit ${row.userName}`,
  values: (row) => ({ displayName: row.userName }),

  onSubmit(row, values) {
    alert(`${JSON.stringify(row)} ${JSON.stringify(values)}`);
  },

  schema: createZodObject($schema, ['displayName']),
});
actions.push({
  type: 'custom-dialog',
  cta: 'Permissions',
  content: (row) => <div>{row.userName} does not have any permissions. </div>,
  cancelText: 'Cancel',
  confirmationText: 'Close',
  icon: KeyIcon,
  title: (row) => row.userName,
  onConfirm: (row) => {
    console.log(row.phone);
  },
  onCancel: (row) => {
    console.log(row.userName);
  },
});

actions.push({
  cancelText: 'Cancel',
  confirmationText: 'Yes, Delete',
  cta: 'Delete User',
  icon: TrashIcon,
  type: 'confirmation-dialog',
  description: 'Are you sure you want to delete this user?',
  title: (row) => row.userName,
  onConfirm: (row) => {
    console.log(row.phone);
  },
  onCancel: (row) => {
    console.log(row.userName);
  },
});