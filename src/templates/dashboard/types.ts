import { DataTableProps } from '../../molecules/tables/types';
import { CardListProps } from '../../organisms/card-list';

type DashboardExtraProps = {
  showCards: boolean;
  showTable: boolean;
};

export type DashboardProps = DashboardExtraProps &
  CardListProps &
  DataTableProps<any>;
