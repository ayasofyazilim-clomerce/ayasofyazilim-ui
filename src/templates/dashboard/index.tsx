import DataTable from '../../molecules/tables';
import CardList from '../../organisms/card-list';
import { DashboardProps } from './types';

export default function Dashboard({
  cards,
  data,
  columnsData,
  action,
  isLoading,
  showCards, // changed withCards to showCards
  showTable, // changed withTable to showTable
  rowCount,
  fetchRequest,
  detailedFilter,
}: DashboardProps) {
  return (
    <>
      {showCards && <CardList isLoading={isLoading} cards={cards} />}
      {showTable && (
        <DataTable
          columnsData={columnsData}
          data={data}
          action={action}
          isLoading={isLoading}
          rowCount={rowCount}
          fetchRequest={fetchRequest}
          detailedFilter={detailedFilter}
        />
      )}
    </>
  );
}
