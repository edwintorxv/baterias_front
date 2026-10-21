import { DecimalPipe } from '@angular/common';
import { Component, Input, OnChanges, effect } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { ChartModule } from 'primeng/chart';
import { ThemeService } from '../../../../core/services/theme.service';

/** Una serie del gráfico (un nivel de riesgo, una frecuencia…), en el orden en que se dibuja. */
export interface SerieBarras {
  id: number;
  /** Encabezado de la tabla y leyenda. */
  corto: string;
  color: string;
}

/** Un grupo (dominio, ciudad, síntoma…) con la cantidad y el % de cada serie. */
export interface FilaBarras {
  nombre: string;
  /** Segunda columna opcional (p. ej. el dominio de una dimensión). */
  detalle?: string;
  /** Base de los porcentajes. */
  total: number;
  /** Cómo se muestra la base, si no es solo el número (p. ej. "1.256 (157 × 8)"). */
  totalTexto?: string;
  valores: { id: number; nombre: string; cantidad: number; porcentaje: number }[];
}

/**
 * Parte un nombre largo en renglones de ~18 caracteres para el eje del gráfico, con 4 renglones como máximo
 * (los síntomas son frases largas: el nombre completo está en la tabla y en el tooltip).
 */
const partir = (texto: string, largo = 18, maxRenglones = 4): string[] => {
  const lineas = texto.split(' ').reduce<string[]>((acumuladas, palabra) => {
    const ultima = acumuladas[acumuladas.length - 1];
    if (ultima !== undefined && (ultima + ' ' + palabra).length <= largo) {
      acumuladas[acumuladas.length - 1] = ultima + ' ' + palabra;
    } else {
      acumuladas.push(palabra);
    }
    return acumuladas;
  }, []);
  if (lineas.length <= maxRenglones) {
    return lineas;
  }
  return [...lineas.slice(0, maxRenglones - 1), lineas[maxRenglones - 1] + '…'];
};

/**
 * Tabla (% por serie, la cantidad en el tooltip) y barras agrupadas de varios grupos, con una serie por
 * categoría en su color (preferencia del usuario: nada de barras 100 % apiladas ni mapas de calor). Las filas
 * van en el orden recibido. La tabla siempre está: los colores claros del semáforo (amarillo, verde claro)
 * tienen poco contraste y la tabla es la lectura exacta.
 */
@Component({
  selector: 'app-barras-por-grupo',
  standalone: true,
  imports: [DecimalPipe, ChartModule],
  templateUrl: './barras-por-grupo.component.html',
  styleUrl: './barras-por-grupo.component.scss'
})
export class BarrasPorGrupoComponent implements OnChanges {

  @Input({ required: true }) titulo!: string;
  @Input({ required: true }) series!: SerieBarras[];
  @Input({ required: true }) filas!: FilaBarras[];
  /** Encabezado de la primera columna (Dominio, Dimensión, Ciudad, Área, Síntoma). */
  @Input() columna = 'Grupo';
  /** Encabezado de la columna de detalle, si las filas lo traen. */
  @Input() columnaDetalle?: string;
  /** Encabezado de la columna de la base. */
  @Input() columnaTotal = 'Personas';
  /** Qué cuenta la base, para el tooltip ("personas", "respuestas"). */
  @Input() unidad = 'personas';
  @Input() nota?: string;
  /** Con muchas filas el gráfico no se lee: se muestra solo la tabla. */
  @Input() grafico = true;

  datos?: ChartData<'bar'>;
  opciones?: ChartOptions<'bar'>;

  constructor(private themeService: ThemeService) {
    // Los colores del texto y la cuadrícula salen del tema: se rearma al cambiar claro/oscuro.
    effect(() => {
      this.themeService.tema();
      this.armarGrafico();
    });
  }

  ngOnChanges(): void {
    this.armarGrafico();
  }

  valor(fila: FilaBarras, serie: number) {
    return fila.valores.find(v => v.id === serie);
  }

  private armarGrafico(): void {
    if (!this.filas || !this.series || !this.grafico) {
      return;
    }
    const estilo = getComputedStyle(document.documentElement);
    const texto = estilo.getPropertyValue('--p-text-muted-color').trim() || '#64748b';
    const borde = estilo.getPropertyValue('--p-content-border-color').trim() || '#e2e8f0';
    const filas = this.filas;
    const series = this.series;

    this.datos = {
      labels: filas.map(f => partir(f.nombre)),
      datasets: series.map(serie => ({
        label: serie.corto,
        data: filas.map(f => this.valor(f, serie.id)?.porcentaje ?? 0),
        backgroundColor: serie.color,
        // Un borde tenue separa del fondo los colores claros (amarillo, verde claro).
        borderColor: 'rgba(0, 0, 0, 0.25)',
        borderWidth: 1,
        borderRadius: { topLeft: 4, topRight: 4 },
        borderSkipped: 'start',
        maxBarThickness: 18
      }))
    };
    this.opciones = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: true },
      plugins: {
        legend: { position: 'bottom', labels: { color: texto, usePointStyle: true, pointStyle: 'rectRounded' } },
        tooltip: {
          callbacks: {
            title: items => filas[items[0].dataIndex].nombre,
            label: item => {
              const fila = filas[item.dataIndex];
              const serie = series[item.datasetIndex];
              const valor = this.valor(fila, serie.id);
              return `${valor?.nombre ?? serie.corto}: ${valor?.cantidad ?? 0} de ${fila.total} ${this.unidad} `
                + `(${(item.raw as number).toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %)`;
            }
          }
        }
      },
      scales: {
        x: { ticks: { color: texto, autoSkip: false, maxRotation: 0 }, grid: { display: false }, border: { color: borde } },
        y: {
          min: 0,
          max: 100,
          ticks: { color: texto, stepSize: 25, callback: valor => `${valor} %` },
          grid: { color: borde },
          border: { display: false }
        }
      }
    };
  }

}
