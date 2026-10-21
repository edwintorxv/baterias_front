import { DecimalPipe } from '@angular/common';
import { Component, Input, OnChanges, effect } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { ChartModule } from 'primeng/chart';
import { ThemeService } from '../../../../core/services/theme.service';
import { COLOR_NIVEL, DistribucionNiveles } from '../../models/informe-empresa.model';

/** Una fila: un dominio, una dimensión, una ciudad o un área, con sus personas por nivel. */
export interface FilaNiveles {
  nombre: string;
  /** Segunda columna opcional (p. ej. el dominio de una dimensión). */
  detalle?: string;
  distribucion: DistribucionNiveles;
}

/** Nombres cortos de los niveles para encabezados y leyenda (el completo va en el tooltip). */
const NIVEL_CORTO: Record<number, string> = { 1: 'Sin riesgo', 2: 'Bajo', 3: 'Medio', 4: 'Alto', 5: 'Muy alto' };

/** Parte un nombre largo en renglones de ~18 caracteres para el eje del gráfico. */
const partir = (texto: string, largo = 18): string[] => texto.split(' ').reduce<string[]>((lineas, palabra) => {
  const ultima = lineas[lineas.length - 1];
  if (ultima !== undefined && (ultima + ' ' + palabra).length <= largo) {
    lineas[lineas.length - 1] = ultima + ' ' + palabra;
  } else {
    lineas.push(palabra);
  }
  return lineas;
}, []);

/**
 * Personas por nivel de riesgo de varios grupos: tabla (% por nivel, la cantidad en el tooltip) y barras
 * agrupadas por nivel con los colores semáforo del Word (preferencia del usuario: nada de barras 100 %
 * apiladas ni mapas de calor). Las filas van en el orden recibido (el ranking del backend). La tabla siempre
 * está: los colores claros (amarillo, verde claro) tienen poco contraste y la tabla es la lectura exacta.
 */
@Component({
  selector: 'app-niveles-por-grupo',
  standalone: true,
  imports: [DecimalPipe, ChartModule],
  templateUrl: './niveles-por-grupo.component.html',
  styleUrl: './niveles-por-grupo.component.scss'
})
export class NivelesPorGrupoComponent implements OnChanges {

  @Input({ required: true }) titulo!: string;
  @Input({ required: true }) filas!: FilaNiveles[];
  /** Encabezado de la primera columna (Dominio, Dimensión, Ciudad, Área). */
  @Input() columna = 'Grupo';
  /** Encabezado de la columna de detalle, si las filas lo traen. */
  @Input() columnaDetalle?: string;
  @Input() nota?: string;
  /** Con muchas filas el gráfico no se lee: se muestra solo la tabla. */
  @Input() grafico = true;

  readonly colorNivel = COLOR_NIVEL;
  readonly nivelCorto = NIVEL_CORTO;
  readonly niveles = [1, 2, 3, 4, 5];

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

  porcentaje(fila: FilaNiveles, nivel: number): number {
    return fila.distribucion.niveles.find(n => n.fkNivelRiesgo === nivel)?.porcentaje ?? 0;
  }

  cantidad(fila: FilaNiveles, nivel: number): number {
    return fila.distribucion.niveles.find(n => n.fkNivelRiesgo === nivel)?.cantidad ?? 0;
  }

  private armarGrafico(): void {
    if (!this.filas || !this.grafico) {
      return;
    }
    const estilo = getComputedStyle(document.documentElement);
    const texto = estilo.getPropertyValue('--p-text-muted-color').trim() || '#64748b';
    const borde = estilo.getPropertyValue('--p-content-border-color').trim() || '#e2e8f0';
    const filas = this.filas;

    this.datos = {
      labels: filas.map(f => partir(f.nombre)),
      datasets: this.niveles.map(nivel => ({
        label: NIVEL_CORTO[nivel],
        data: filas.map(f => this.porcentaje(f, nivel)),
        backgroundColor: COLOR_NIVEL[nivel],
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
              const nivel = this.niveles[item.datasetIndex];
              const completo = fila.distribucion.niveles.find(n => n.fkNivelRiesgo === nivel)?.nivel ?? NIVEL_CORTO[nivel];
              return `${completo}: ${this.cantidad(fila, nivel)} de ${fila.distribucion.total} `
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
