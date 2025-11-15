import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartType, Chart, registerables, ChartData } from 'chart.js';

Chart.register(...registerables);

import { IncomeService, Income, Client } from '../../services/income.service';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent implements OnInit {

  incomes: Income[] = [];
  clients: Client[] = [];

  filterType: string = 'month';

  chartLabels: string[] = [];

  // מתקנים: משתמשים ב-ChartData במקום number[]
  chartData: ChartData<'pie'> = {
    labels: [],
    datasets: [
      {
        data: []
      }
    ]
  };

  chartType: ChartType = 'pie';

  constructor(private incomeService: IncomeService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.incomeService.getIncomes().subscribe(data => {
      this.incomes = data || [];
      this.buildChart();
    });

    this.incomeService.getClients().subscribe(data => {
      this.clients = data || [];
    });
  }

  buildChart(): void {
    const map: { [key: string]: number } = {};

    this.incomes.forEach(i => {
      const d = new Date(i.date);

      let key = '';

      if (this.filterType === 'month') {
        key = `${d.getMonth() + 1}/${d.getFullYear()}`;
      }
      if (this.filterType === 'year') {
        key = `${d.getFullYear()}`;
      }
      if (this.filterType === 'client') {
        key = this.clients.find(c => c._id === i.clientId)?.name || 'לא ידוע';
      }

      if (!map[key]) map[key] = 0;
      map[key] += i.amount;
    });

    this.chartLabels = Object.keys(map);

    // עדכון chartData לפי הדרישה של Chart.js
    this.chartData = {
      labels: this.chartLabels,
      datasets: [
        {
          data: Object.values(map)
        }
      ]
    };
  }

  onFilterChange(): void {
    this.buildChart();
  }
}
