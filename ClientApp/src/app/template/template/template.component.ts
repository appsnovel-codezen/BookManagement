import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { EntityDataService } from 'src/app/angular-app-services/entity-data.service';
import { LayoutService } from 'src/app/angular-app-services/layout.service';
import { _camelCase } from 'src/app/library/utils';

@Component({
  selector: 'app-template',
  templateUrl: './template.component.html',
  styleUrl: './template.component.scss'
})
export class TemplateComponent implements OnInit {
  entityName: string = '';
  mappedListData: any[] = [];
  mappedPreviewData: any[] = [];

  private destroy = new Subject();
  private editLayout: any[] = [];
  private listLayout: any;
  private records: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private entityDataService: EntityDataService,
    private layoutService: LayoutService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.entityName = params['entityName'];
      this.getList();
    });
  }

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }

  previewRecord(index: number): void {
    if (this.records?.length > index) {
      this.mapPreviewData(this.records[index]);
    }
  }

  private getFormattedData(record: any, fieldInfo: any): any {
    if (!fieldInfo?.dataType || !fieldInfo?.fieldName || !record) return '';
    const fieldName = _camelCase(fieldInfo.fieldName),
      data = record[fieldName] || '';
    switch (fieldInfo.dataType.toLowerCase()) {
      case 'datetime':
        const date = Date.parse(data + 'Z');
        return isNaN(date) ? data : new Date(data + 'Z').toLocaleString();
      case 'numeric':
        return new Intl.NumberFormat().format(Number(data));
      case 'guid':
        const refPropertyName = fieldName.replace('Id', ''),
          refObject = record[refPropertyName];
        return refObject?.name || this.getRefData(refObject.$ref, this.records)?.name || data;
      default:
        return data;
    }
  }

  private getList(): void {
    const apis = [
      this.layoutService.getLayout(this.entityName, 'List'),
      this.layoutService.getLayout(this.entityName, 'Edit'),
      this.entityDataService.getData(this.entityName)
    ];
    forkJoin(apis)
      .pipe(takeUntil(this.destroy))
      .subscribe({
        next: ([listLayout, editLayout, records]) => {
          this.records = records;
          this.editLayout = editLayout;
          this.listLayout = listLayout;

          this.prepareMappedData();

          this.mapPreviewData(this.records?.[0]);
        }
      });
  }

  private getRefData(ref: string, records: any): any {
    if (Array.isArray(records)) {
      for (const record of records) {
        if (typeof record === 'object') {
          const val = this.getRefData(ref, record);
          if (val) return val;
        }
      };
    } else {
      for (const [key, value] of Object.entries(records)) {
        if (key === '$id' && value === ref) {
          return records;
        } else if (typeof value === 'object') {
          const val = this.getRefData(ref, value);
          if (val) return val;
        }
      }
    }
  }

  private mapPreviewData(record: any): void {
    if (record && this.editLayout) {
      this.mappedPreviewData = this.editLayout.map(node => {
        return {
          name: node.name,
          type: node.type,
          fields: node.fields.map((field: any) => {
            return {
              label: field.label,
              value: this.getFormattedData(record, field)
            };
          })
        };
      });
    }
    else
      this.mappedPreviewData = [];
  }

  private prepareMappedData(): void {
    if (this.records?.length > 0 && this.listLayout) {
      this.mappedListData = this.records.map(record => {
        const titles = this.listLayout.cardTitle?.fields?.map(
          (title: any) => {
            return {
              label: title.label,
              value: this.getFormattedData(record, title)
            };
          }) || [],
          details = this.listLayout.cardDetail?.fields?.map(
            (detail: any) => {
              return {
                label: detail.label,
                value: this.getFormattedData(record, detail)
              };
            }) || [],
          status = this.listLayout.cardStatus?.fields?.map(
            (status: any) => {
              return {
                label: status.label,
                value: this.getFormattedData(record, status)
              };
            }) || [];
        return {
          cardTitle: titles ? { fields: titles } : null,
          cardDetail: details ? { fields: details } : null,
          cardStatus: status ? { fields: status } : null
        };
      });
    }
    else
      this.mappedListData = [];
  }
}
