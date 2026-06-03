declare namespace NaiveUI {
  type ThemeColor = 'default' | 'error' | 'primary' | 'info' | 'success' | 'warning';
  type Align = 'stretch' | 'baseline' | 'start' | 'end' | 'center' | 'flex-end' | 'flex-start';

  type DataTableColumn<T> = import('naive-ui').DataTableColumns<T>[number];
  type DataTableExpandColumn<T> = Extract<DataTableColumn<T>, { type: 'expand' }>;
  type DataTableSelectionColumn<T> = Extract<DataTableColumn<T>, { type: 'selection' }>;
  type TableColumnCheck = import('@sa/hooks').TableColumnCheck;
  type TableColumnFixed = import('@sa/hooks').TableColumnCheck['fixed'];

  type TableColumnWithKey<T> = DataTableColumn<T> & { key: keyof T | (string & {}) };

  type TableColumn<T> = DataTableColumn<T>;

  /**
   * the type of table operation
   *
   * - add: add table item
   * - edit: edit table item
   */
  type TableOperateType = 'add' | 'edit';
}
