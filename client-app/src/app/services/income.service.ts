import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Income {
  _id?: string;
  clientId?: string;
  date: string | Date;
  description: string;
  amount: number;
}

export interface Client {
  _id?: string;
  name: string;
  businessName: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class IncomeService {
  // חשוב: להתאים לכתובת השרת שלך - server.js משתמש ב /api/incomes ו /api/clients
  private incomesUrl = 'http://localhost:5000/api/incomes';
  private clientsUrl = 'http://localhost:5000/api/clients';

  constructor(private http: HttpClient) {}

  getIncomes(): Observable<Income[]> {
    return this.http.get<Income[]>(this.incomesUrl);
  }

  addIncome(income: Omit<Income, '_id'>): Observable<Income> {
    return this.http.post<Income>(this.incomesUrl, income);
  }

  deleteIncome(id: string): Observable<void> {
    return this.http.delete<void>(`${this.incomesUrl}/${id}`);
  }

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.clientsUrl);
  }

  addClient(client: Client): Observable<Client> {
    return this.http.post<Client>(this.clientsUrl, client);
  }
} 