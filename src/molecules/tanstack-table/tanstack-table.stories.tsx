import { Meta, StoryFn } from '@storybook/react';
import {
  Building2,
  Edit,
  LinkIcon,
  PlusCircle,
  SaveIcon,
  Trash2,
  User2,
} from 'lucide-react';
import { createZodObject } from 'src/lib/create-zod-object';
import TanstackTable from '.';
import {
  $editMerchantDto,
  $merchantSchema,
  col,
  Merchant,
  merchants,
  rowActions,
  tableAction,
} from './tanstack-table.stories.data';
import {
  tanstackTableCreateColumnsByRowData,
  tanstackTableEditableColumnsByRowData,
} from './utils';

export default {
  component: TanstackTable,
  argTypes: {},
  parameters: {
    layout: 'centered',
    nextjs: {
      appDirectory: true,
    },
  },
} as Meta<typeof TanstackTable>;

const template: StoryFn<typeof TanstackTable> = (args) => (
  <div className="max-w-[1400px]">
    <TanstackTable
      {...args}
      data={merchants}
      columns={col}
      rowActions={rowActions}
      tableActions={tableAction}
      excludeColumns={['id']}
    />
  </div>
);

export const Default = template.bind({});
Default.args = {
  filters: {
    textFilters: ['name'],
  },
  selectedRowAction: {
    icon: Trash2,
    actionLocation: 'table',
    cta: `Delete`,
    onClick: (selectedIds) => {
      alert(`deleted rows:\n${selectedIds}`);
    },
  },
};

const linkStory: StoryFn<typeof TanstackTable> = (args) => (
  <div className="max-w-[1400px]">
    <TanstackTable
      {...args}
      data={merchants}
      columns={linkCol}
      columnVisibility={{
        type: 'show',
        columns: ['name', 'entityInformationTypeCode'],
      }}
    />
  </div>
);
const linkCol = tanstackTableCreateColumnsByRowData<Merchant>({
  rows: $merchantSchema.properties,
  links: {
    name: {
      targetAccessorKey: 'id',
      prefix: 'http://192.168.1.105:1453/tr/app/admin',
      suffix: '/edit',
    },
    entityInformationTypeCode: {
      prefix: 'http://192.168.1.105:1453/tr/app/',
    },
  },
});
export const LinkColumns = linkStory.bind({});

const badgeStory: StoryFn<typeof TanstackTable> = (args) => (
  <div className="max-w-[1400px]">
    <TanstackTable
      {...args}
      data={merchants}
      columns={badgeCol}
      columnVisibility={{
        type: 'show',
        columns: ['name', 'entityInformationTypeCode'],
      }}
    />
  </div>
);
const badgeCol = tanstackTableCreateColumnsByRowData<Merchant>({
  rows: $merchantSchema.properties,
  badges: {
    entityInformationTypeCode: {
      values: [
        {
          label: 'Organizasyon',
          conditions: [
            {
              conditionAccessorKey: 'typeCode',
              when: (value) => value === 'HEADQUARTER',
            },
          ],
        },
        {
          label: 'Bireysel',
          conditions: [
            {
              conditionAccessorKey: 'typeCode',
              when: (value) => value === 'STORE',
            },
          ],
        },
      ],
    },
  },
});
export const BadgeColumns = badgeStory.bind({});

const iconStory: StoryFn<typeof TanstackTable> = (args) => (
  <div className="max-w-[1400px]">
    <TanstackTable
      {...args}
      data={merchants}
      columns={iconCol}
      columnVisibility={{
        type: 'show',
        columns: ['name', 'entityInformationTypeCode'],
      }}
    />
  </div>
);
const iconCol = tanstackTableCreateColumnsByRowData<Merchant>({
  rows: $merchantSchema.properties,
  icons: {
    name: {
      icon: LinkIcon,
      iconClassName: 'text-blue-500',
    },
  },
});
export const IconColumns = iconStory.bind({});

const facetedStory: StoryFn<typeof TanstackTable> = (args) => (
  <div className="max-w-[1400px]">
    <TanstackTable
      {...args}
      data={merchants}
      columns={facetedCol}
      columnVisibility={{
        type: 'show',
        columns: ['name', 'entityInformationTypeCode'],
      }}
    />
  </div>
);
const facetedCol = tanstackTableCreateColumnsByRowData<Merchant>({
  rows: $merchantSchema.properties,
  faceted: {
    entityInformationTypeCode: {
      options: [
        {
          value: 'INDIVIDUAL',
          label: 'Bireysel',
          icon: User2,
        },
        {
          value: 'ORGANIZATION',
          label: 'Organizasyon',
          icon: Building2,
        },
      ],
    },
  },
});
export const FacetedColumns = facetedStory.bind({});
const translatedStory: StoryFn<typeof TanstackTable> = (args) => (
  <div className="max-w-[1400px]">
    <TanstackTable
      {...args}
      data={merchants}
      columns={translatedCol}
      columnVisibility={{
        type: 'show',
        columns: ['name', 'entityInformationTypeCode'],
      }}
    />
  </div>
);
const translatedCol = tanstackTableCreateColumnsByRowData<Merchant>({
  rows: $merchantSchema.properties,
  languageData: {
    name: 'Ad',
    entityInformationTypeCode: 'Tip',
  },
});
export const TranslatedColumns = translatedStory.bind({});

const editRowStory: StoryFn<typeof TanstackTable> = (args) => (
  <div className="max-w-[1400px]">
    <TanstackTable
      {...args}
      data={merchants}
      columns={editRowCol}
      columnVisibility={{
        type: 'show',
        columns: ['name', 'entityInformationTypeCode'],
      }}
      rowActions={[
        {
          type: 'autoform-dialog',
          actionLocation: 'row',
          icon: Edit,
          schema: createZodObject($editMerchantDto),
          cta: 'Düzenle',
          title: (row) => `${row.name}'i güncelle`,
          onSubmit(row, values) {
            alert(JSON.stringify(row));
            alert(JSON.stringify(values));
          },
          values: (row) => row,
          submitText: 'Güncelle',
        },
      ]}
    />
  </div>
);
const editRowCol = tanstackTableCreateColumnsByRowData<Merchant>({
  rows: $merchantSchema.properties,
  languageData: {
    name: 'Ad',
    entityInformationTypeCode: 'Tip',
  },
});
export const EditRow = editRowStory.bind({});

const editableRowStory: StoryFn<typeof TanstackTable> = (args) => (
  <div className="max-w-[1400px]">
    <TanstackTable
      {...args}
      data={merchants}
      columns={editableRowCol}
      columnVisibility={{
        type: 'show',
        columns: ['name', 'entityInformationTypeCode'],
      }}
      tableActions={[
        {
          type: 'create-row',
          actionLocation: 'table',
          cta: 'Create Row',
          icon: PlusCircle,
        },
      ]}
      selectedRowAction={{
        actionLocation: 'table',
        cta: 'Save',
        icon: SaveIcon,
        onClick: (selectedIds, selectedRows) => {
          alert(JSON.stringify(selectedIds));
          alert(JSON.stringify(selectedRows));
        },
      }}
    />
  </div>
);
const editableRowCol = tanstackTableEditableColumnsByRowData<Merchant>({
  rows: {
    ...$merchantSchema.properties,
    typeCode: {
      ...$merchantSchema.properties.typeCode,
      enum: $merchantSchema.properties.typeCode.enum.map((item) => ({
        value: item,
        label: item,
      })),
    },
    entityInformationTypeCode: {
      ...$merchantSchema.properties.entityInformationTypeCode,
      enum: $merchantSchema.properties.entityInformationTypeCode.enum.map(
        (item) => ({
          value: item,
          label: item,
        })
      ),
    },
  },
  languageData: {
    name: 'Ad',
    entityInformationTypeCode: 'Tip',
  },
});
export const EditableRow = editableRowStory.bind({});

const conditionalStory: StoryFn<typeof TanstackTable> = (args) => (
  <div className="max-w-[1400px]">
    <TanstackTable
      {...args}
      data={merchants}
      columns={conditionalCol}
      columnVisibility={{
        type: 'show',
        columns: ['name', 'entityInformationTypeCode'],
      }}
    />
  </div>
);
const conditionalCol = tanstackTableCreateColumnsByRowData<Merchant>({
  rows: $merchantSchema.properties,
  links: {
    name: {
      targetAccessorKey: 'id',
      prefix: '/app/admin/parties/merchants',
      conditions: [
        {
          conditionAccessorKey: 'entityInformationTypeCode',
          when: (value) => value === 'ORGANIZATION',
        },
      ],
    },
  },
  classNames: {
    name: [
      {
        className: 'bg-red-500',
        conditions: [
          {
            conditionAccessorKey: 'entityInformationTypeCode',
            when: (value) => {
              console.log(value);
              return value !== 'ORGANIZATION';
            },
          },
        ],
      },
    ],
  },
  faceted: {
    entityInformationTypeCode: {
      options: [
        {
          value: 'INDIVIDUAL',
          label: 'Bireysel',
          icon: User2,
        },
        {
          value: 'ORGANIZATION',
          label: 'Organizasyon',
          icon: Building2,
        },
      ],
    },
  },
});
export const conditionalColumns = conditionalStory.bind({});
