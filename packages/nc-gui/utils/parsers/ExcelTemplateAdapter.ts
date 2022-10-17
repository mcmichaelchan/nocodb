import { UITypes } from 'nocodb-sdk'
import TemplateGenerator from './TemplateGenerator'
import { getCheckboxValue, isCheckboxType } from './parserHelpers'
import { getDateFormat } from '~/utils'

const excelTypeToUidt: Record<string, UITypes> = {
  d: UITypes.DateTime,
  b: UITypes.Checkbox,
  n: UITypes.Number,
  s: UITypes.SingleLineText,
}

export default class ExcelTemplateAdapter extends TemplateGenerator {
  config: {
    maxRowsToParse: number
  } & Record<string, any>

  name: string

  excelData: any

  project: {
    title: string
    tables: any[]
  }

  data: Record<string, any> = {}

  wb: any

  xlsx: typeof import('xlsx')

  constructor(name = '', data = {}, parserConfig = {}) {
    super()
    this.config = {
      maxRowsToParse: 500,
      ...parserConfig,
    }

    this.name = name

    this.excelData = data

    this.project = {
      title: this.name,
      tables: [],
    }

    this.xlsx = {} as any
  }

  async init() {
    this.xlsx = await import('xlsx')

    const options = {
      cellText: true,
      cellDates: true,
    }

    if (this.name.slice(-3) === 'csv') {
      this.wb = this.xlsx.read(new TextDecoder().decode(new Uint8Array(this.excelData)), {
        type: 'string',
        ...options,
      })
    } else {
      this.wb = this.xlsx.read(new Uint8Array(this.excelData), {
        type: 'array',
        ...options,
      })
    }
  }

  parse() {
    const tableNamePrefixRef: Record<string, any> = {}

    // TODO: find the upper bound / make it configurable
    const maxSelectOptionsAllowed = 64

    for (let i = 0; i < this.wb.SheetNames.length; i++) {
      const columnNamePrefixRef: Record<string, any> = { id: 0 }
      const sheet: any = this.wb.SheetNames[i]
      let tn: string = (sheet || 'table').replace(/[` ~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/g, '_').trim()

      while (tn in tableNamePrefixRef) {
        tn = `${tn}${++tableNamePrefixRef[tn]}`
      }
      tableNamePrefixRef[tn] = 0

      const table = { table_name: tn, ref_table_name: tn, columns: [] as any[] }
      this.data[tn] = []
      const ws: any = this.wb.Sheets[sheet]
      const range = this.xlsx.utils.decode_range(ws['!ref'])
      let rows: any = this.xlsx.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: null })

      if (this.name.slice(-3) !== 'csv') {
        // fix precision bug & timezone offset issues introduced by xlsx
        const basedate = new Date(1899, 11, 30, 0, 0, 0)
        // number of milliseconds since base date
        const dnthresh = basedate.getTime() + (new Date().getTimezoneOffset() - basedate.getTimezoneOffset()) * 60000
        // number of milliseconds in a day
        const day_ms = 24 * 60 * 60 * 1000
        // handle date1904 property
        const fixImportedDate = (date: Date) => {
          const parsed = this.xlsx.SSF.parse_date_code((date.getTime() - dnthresh) / day_ms, {
            date1904: this.wb.Workbook.WBProps.date1904,
          })
          return new Date(parsed.y, parsed.m, parsed.d, parsed.H, parsed.M, parsed.S)
        }
        // fix imported date
        rows = rows.map((r: any) =>
          r.map((v: any) => {
            return v instanceof Date ? fixImportedDate(v) : v
          }),
        )
      }

      const columnNameRowExist = +rows[0].every((v: any) => v === null || typeof v === 'string')

      // const colLen = Math.max()
      for (let col = 0; col < rows[0].length; col++) {
        let cn: string = ((columnNameRowExist && rows[0] && rows[0][col] && rows[0][col].toString().trim()) || `field_${col + 1}`)
          .replace(/[` ~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/g, '_')
          .trim()

        while (cn in columnNamePrefixRef) {
          cn = `${cn}${++columnNamePrefixRef[cn]}`
        }
        columnNamePrefixRef[cn] = 0

        const column: Record<string, any> = {
          column_name: cn,
          ref_column_name: cn,
          meta: {},
        }

        // const cellId = `${col.toString(26).split('').map(s => (parseInt(s, 26) + 10).toString(36).toUpperCase())}2`;
        const cellId = this.xlsx.utils.encode_cell({
          c: range.s.c + col,
          r: columnNameRowExist,
        })
        const cellProps = ws[cellId] || {}
        column.uidt = excelTypeToUidt[cellProps.t] || UITypes.SingleLineText

        // todo: optimize
        if (column.uidt === UITypes.SingleLineText) {
          // check for long text
          if (rows.some((r: any) => (r[col] || '').toString().match(/[\r\n]/) || (r[col] || '').toString().length > 255)) {
            column.uidt = UITypes.LongText
          } else {
            const vals = rows
              .slice(columnNameRowExist ? 1 : 0)
              .map((r: any) => r[col])
              .filter((v: any) => v !== null && v !== undefined && v.toString().trim() !== '')

            const checkboxType = isCheckboxType(vals)
            if (checkboxType.length === 1) {
              column.uidt = UITypes.Checkbox
            } else {
              if (vals.some((v: any) => v && v.toString().includes(','))) {
                const flattenedVals = vals.flatMap((v: any) =>
                  v
                    ? v
                        .toString()
                        .trim()
                        .split(/\s*,\s*/)
                    : [],
                )

                // TODO: handle case sensitive case
                const uniqueVals = [...new Set(flattenedVals.map((v: any) => v.toString().trim().toLowerCase()))]

                if (uniqueVals.length > maxSelectOptionsAllowed) {
                  // too many options are detected, convert the column to SingleLineText instead
                  column.uidt = UITypes.SingleLineText
                  // _disableSelect is used to disable the <a-select-option/> in TemplateEditor
                  column._disableSelect = true
                } else {
                  // assume the column type is multiple select if there are repeated values
                  if (flattenedVals.length > uniqueVals.length && uniqueVals.length <= Math.ceil(flattenedVals.length / 2)) {
                    column.uidt = UITypes.MultiSelect
                  }
                  // set dtxp here so that users can have the options even they switch the type from other types to MultiSelect
                  // once it's set, dtxp needs to be reset if the final column type is not MultiSelect
                  column.dtxp = `'${uniqueVals.join("','")}'`
                }
              } else {
                // TODO: handle case sensitive case
                const uniqueVals = [...new Set(vals.map((v: any) => v.toString().trim().toLowerCase()))]

                if (uniqueVals.length > maxSelectOptionsAllowed) {
                  // too many options are detected, convert the column to SingleLineText instead
                  column.uidt = UITypes.SingleLineText
                  // _disableSelect is used to disable the <a-select-option/> in TemplateEditor
                  column._disableSelect = true
                } else {
                  // assume the column type is single select if there are repeated values
                  // once it's set, dtxp needs to be reset if the final column type is not Single Select
                  if (vals.length > uniqueVals.length && uniqueVals.length <= Math.ceil(vals.length / 2)) {
                    column.uidt = UITypes.SingleSelect
                  }
                  // set dtxp here so that users can have the options even they switch the type from other types to SingleSelect
                  // once it's set, dtxp needs to be reset if the final column type is not SingleSelect
                  column.dtxp = `'${uniqueVals.join("','")}'`
                }
              }
            }
          }
        } else if (column.uidt === UITypes.Number) {
          if (
            rows.slice(1, this.config.maxRowsToParse).some((v: any) => {
              return v && v[col] && parseInt(v[col]) !== +v[col]
            })
          ) {
            column.uidt = UITypes.Decimal
          }
          if (
            rows.slice(1, this.config.maxRowsToParse).every((v: any, i: any) => {
              const cellId = this.xlsx.utils.encode_cell({
                c: range.s.c + col,
                r: i + columnNameRowExist,
              })

              const cellObj = ws[cellId]

              return !cellObj || (cellObj.w && cellObj.w.startsWith('$'))
            })
          ) {
            column.uidt = UITypes.Currency
          }
        } else if (column.uidt === UITypes.DateTime) {
          // hold the possible date format found in the date
          const dateFormat: Record<string, number> = {}
          if (
            rows.slice(1, this.config.maxRowsToParse).every((v: any, i: any) => {
              const cellId = this.xlsx.utils.encode_cell({
                c: range.s.c + col,
                r: i + columnNameRowExist,
              })

              const cellObj = ws[cellId]
              const isDate = !cellObj || (cellObj.w && cellObj.w.split(' ').length === 1)
              if (isDate && cellObj) {
                dateFormat[getDateFormat(cellObj.w)] = (dateFormat[getDateFormat(cellObj.w)] || 0) + 1
              }
              return isDate
            })
          ) {
            column.uidt = UITypes.Date
            // take the date format with the max occurrence
            column.meta.date_format =
              Object.keys(dateFormat).reduce((x, y) => (dateFormat[x] > dateFormat[y] ? x : y)) || 'YYYY/MM/DD'
          }
        }
        table.columns.push(column)
      }

      let rowIndex = 0
      for (const row of rows.slice(1)) {
        const rowData: Record<string, any> = {}
        for (let i = 0; i < table.columns.length; i++) {
          if (table.columns[i].uidt === UITypes.Checkbox) {
            rowData[table.columns[i].column_name] = getCheckboxValue(row[i])
          } else if (table.columns[i].uidt === UITypes.Currency) {
            const cellId = this.xlsx.utils.encode_cell({
              c: range.s.c + i,
              r: rowIndex + columnNameRowExist,
            })

            const cellObj = ws[cellId]
            rowData[table.columns[i].column_name] = (cellObj && cellObj.w && cellObj.w.replace(/[^\d.]+/g, '')) || row[i]
          } else if (table.columns[i].uidt === UITypes.SingleSelect || table.columns[i].uidt === UITypes.MultiSelect) {
            rowData[table.columns[i].column_name] = (row[i] || '').toString().trim() || null
          } else if (table.columns[i].uidt === UITypes.Date) {
            const cellId = this.xlsx.utils.encode_cell({
              c: range.s.c + i,
              r: rowIndex + columnNameRowExist,
            })
            const cellObj = ws[cellId]
            rowData[table.columns[i].column_name] = (cellObj && cellObj.w) || row[i]
          } else {
            // toto: do parsing if necessary based on type
            rowData[table.columns[i].column_name] = row[i]
          }
        }
        this.data[tn].push(rowData)
        rowIndex++
      }
      this.project.tables.push(table)
    }
  }

  getTemplate() {
    return this.project
  }

  getData() {
    return this.data
  }

  getColumns() {
    return this.project.tables.map((t: Record<string, any>) => t.columns)
  }
}
