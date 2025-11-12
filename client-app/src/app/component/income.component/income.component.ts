import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { IncomeService, Income, Client } from '../../services/income.service';

@Component({
  selector: 'app-income',
  standalone: true,
  templateUrl: './income.component.html',
  styleUrls: ['./income.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSnackBarModule
  ]
})
export class IncomeComponent implements OnInit {
  protected readonly Math = Math;
  incomes: Income[] = [];
  filteredIncomes: Income[] = [];
  pagedIncomes: Income[] = [];
  displayedColumns = ['date', 'description', 'amount', 'actions'];

  currentPage = 0;
  itemsPerPage = 6;

  selectedMonth: number | null = null;
  selectedYear: number | null = null;
  years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  months = Array.from({ length: 12 }, (_, i) => i + 1);

  clients: Client[] = [];
  selectedClientId: string | null = null;
  newClient: Client = { name: '', businessName: '', email: '' };
  newIncome: Income = { description: '', amount: 0, date: new Date(), clientId: '' };

  isAdding = false;
  showClientForm = false;
  showIncomeForm = false;

  constructor(private incomeService: IncomeService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadIncomes();
    this.loadClients();
  }

  loadIncomes(): void {
    this.incomeService.getIncomes().subscribe({
      next: data => {
        this.incomes = (data || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.applyFilter();
      },
      error: () => this.showMessage('שגיאה בטעינת הכנסות', true)
    });
  }

  loadClients(): void {
    this.incomeService.getClients().subscribe({
      next: data => (this.clients = data || []),
      error: () => this.showMessage('שגיאה בטעינת לקוחות', true)
    });
  }

  applyFilter(): void {
    this.filteredIncomes = this.incomes.filter(income => {
      const d = new Date(income.date);
      if (this.selectedYear && this.selectedMonth) {
        return d.getFullYear() === this.selectedYear && d.getMonth() + 1 === this.selectedMonth;
      }
      if (this.selectedYear) return d.getFullYear() === this.selectedYear;
      if (this.selectedMonth)
        return d.getMonth() + 1 === this.selectedMonth && d.getFullYear() === new Date().getFullYear();
      return true;
    });
    this.currentPage = 0;
    this.updatePagedIncomes();
  }

  // ✅ חישוב סכום כולל של השורות שמוצגות אחרי סינון
  getTotalAmount(): number {
    return this.filteredIncomes.reduce((sum, income) => sum + (income.amount || 0), 0);
  }

  updatePagedIncomes(): void {
    const start = this.currentPage * this.itemsPerPage;
    this.pagedIncomes = this.filteredIncomes.slice(start, start + this.itemsPerPage);
  }

  nextPage(): void {
    if ((this.currentPage + 1) * this.itemsPerPage < this.filteredIncomes.length) {
      this.currentPage++;
      this.updatePagedIncomes();
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePagedIncomes();
    }
  }

  startAddIncome(): void {
    this.isAdding = true;
    this.showClientForm = true;
    this.showIncomeForm = false;
    this.newClient = { name: '', businessName: '', email: '' };
    this.newIncome = { description: '', amount: 0, date: new Date(), clientId: '' };
    this.selectedClientId = null;
  }

  onClientSelect(clientId: string | null): void {
    this.selectedClientId = clientId;
    if (clientId) {
      this.showClientForm = false;
      this.showIncomeForm = true;
      this.newIncome.clientId = clientId;
    } else {
      this.showClientForm = true;
      this.showIncomeForm = false;
    }
  }

  saveClient(): void {
    if (!this.newClient.name || !this.newClient.businessName || !this.newClient.email) {
      this.showMessage('יש למלא את כל פרטי הלקוח', true);
      return;
    }
    this.incomeService.addClient(this.newClient).subscribe({
      next: client => {
        this.clients.push(client);
        this.selectedClientId = client._id || null;
        this.newIncome.clientId = this.selectedClientId || '';
        this.showClientForm = false;
        this.showIncomeForm = true;
        this.showMessage('לקוח נשמר בהצלחה');
      },
      error: () => this.showMessage('שגיאה בשמירת הלקוח', true)
    });
  }

  saveIncome(): void {
    if (!this.newIncome.description || !this.newIncome.amount) {
      this.showMessage('יש למלא תיאור וסכום', true);
      return;
    }
    this.newIncome.clientId = this.selectedClientId || '';
    this.newIncome.date = new Date();
    this.incomeService.addIncome(this.newIncome).subscribe({
      next: () => {
        this.showMessage('הכנסה נוספה בהצלחה');
        this.cancelAdd();
        this.loadIncomes();
      },
      error: () => this.showMessage('שגיאה בשמירת ההכנסה', true)
    });
  }

  deleteIncome(id: string | undefined): void {
    if (!id) return;
    if (confirm('האם למחוק?')) {
      this.incomeService.deleteIncome(id).subscribe({
        next: () => {
          this.incomes = this.incomes.filter(income => income._id !== id);
          this.filteredIncomes = this.filteredIncomes.filter(income => income._id !== id);
          this.updatePagedIncomes();
          this.showMessage('נמחק בהצלחה');
        },
        error: err => {
          console.error('שגיאה במחיקה:', err);
          this.showMessage('שגיאה במחיקה', true);
        }
      });
    }
  }

  cancelAdd(): void {
    this.isAdding = false;
    this.showClientForm = false;
    this.showIncomeForm = false;
    this.selectedClientId = null;
    this.newClient = { name: '', businessName: '', email: '' };
    this.newIncome = { description: '', amount: 0, date: new Date(), clientId: '' };
  }

  private showMessage(msg: string, isError = false): void {
    this.snackBar.open(msg, 'סגור', {
      duration: 3000,
      panelClass: isError ? ['error-snackbar'] : ['success-snackbar']
    });
  }
}
