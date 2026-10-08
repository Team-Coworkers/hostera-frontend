import { effect, Signal } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

/**
 * Creates a Material table data source fed by a signal, with the sort and paginator
 * of a view that may render the table conditionally. Call it in an injection context.
 *
 * @param rows - Rows to show, already filtered.
 * @param sort - Sort header of the table, once rendered.
 * @param paginator - Paginator of the table, once rendered.
 * @param sortValues - Sort value of each sortable column, by column name.
 * @returns Data source bound to the table.
 */
export function signalTableDataSource<T>(
  rows: Signal<T[]>,
  sort: Signal<MatSort | undefined>,
  paginator: Signal<MatPaginator | undefined>,
  sortValues: Record<string, (row: T) => string | number | undefined | null>,
): MatTableDataSource<T> {
  const dataSource = new MatTableDataSource<T>([]);
  dataSource.sortingDataAccessor = (row, column) => {
    const value = sortValues[column]?.(row);
    return typeof value === 'string' ? value.toLowerCase() : (value ?? '');
  };
  effect(() => {
    dataSource.data = rows();
  });
  effect(() => {
    dataSource.sort = sort() ?? null;
    dataSource.paginator = paginator() ?? null;
  });
  return dataSource;
}
