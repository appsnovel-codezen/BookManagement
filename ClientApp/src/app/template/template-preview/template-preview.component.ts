import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-template-preview',
  templateUrl: './template-preview.component.html',
  styleUrl: './template-preview.component.scss'
})
export class TemplatePreviewComponent {
  @Input() mappedData: any[] = [];
  @Input() entityName: string = '';
}
