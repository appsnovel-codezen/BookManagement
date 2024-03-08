import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from '../app-config.service';

@Injectable({
    providedIn: 'root'
})
export class EntityDataService {
    private baseUrl = `${AppConfigService.appConfig.api.url}/api`;

    constructor(private http: HttpClient) { }

    getData(entityName: string): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/${entityName}`);
    }
}
