import { logger } from '@/core/logging/logger';
import { getDoctorsPage } from '@/features/consultation/data/doctorPagination';
import { getProductsPage } from '@/features/shop/data/productPagination';
import { getHealthRecordsPage } from '@/features/health-records/data/healthRecordPagination';
import { DOCTOR_COUNT } from '@/features/consultation/domain/types';
import { PRODUCT_COUNT } from '@/features/shop/domain/types';
import { HEALTH_RECORD_COUNT } from '@/features/health-records/domain/types';

export interface BenchmarkResult {
  doctorsPageMs: number;
  productsPageMs: number;
  healthRecordsPageMs: number;
  doctorsFilterPageMs: number;
  productsFilterPageMs: number;
  healthRecordsFilterPageMs: number;
  doctorCount: number;
  productCount: number;
  recordCount: number;
}

/**
 * Benchmarks the same pagination paths the UI uses (page-sized fetches),
 * not full-dataset materialization — matching FlashList + infinite query usage.
 */
class PerformanceMonitor {
  runBenchmark(): BenchmarkResult {
    logger.info('Running performance benchmark');

    const t1 = performance.now();
    getDoctorsPage({}, 1, 20);
    const doctorsPageMs = performance.now() - t1;

    const t1f = performance.now();
    getDoctorsPage({ search: 'sharma', minRating: 4 }, 1, 20);
    const doctorsFilterPageMs = performance.now() - t1f;

    const t2 = performance.now();
    getProductsPage({}, 'popularity', 1, 20);
    const productsPageMs = performance.now() - t2;

    const t2f = performance.now();
    getProductsPage({ search: 'ashwagandha' }, 'price_asc', 1, 20);
    const productsFilterPageMs = performance.now() - t2f;

    const t3 = performance.now();
    getHealthRecordsPage({}, 1, 50);
    const healthRecordsPageMs = performance.now() - t3;

    const t3f = performance.now();
    getHealthRecordsPage({ type: 'lab_report' }, 1, 50);
    const healthRecordsFilterPageMs = performance.now() - t3f;

    const result: BenchmarkResult = {
      doctorsPageMs: Math.round(doctorsPageMs),
      productsPageMs: Math.round(productsPageMs),
      healthRecordsPageMs: Math.round(healthRecordsPageMs),
      doctorsFilterPageMs: Math.round(doctorsFilterPageMs),
      productsFilterPageMs: Math.round(productsFilterPageMs),
      healthRecordsFilterPageMs: Math.round(healthRecordsFilterPageMs),
      doctorCount: DOCTOR_COUNT,
      productCount: PRODUCT_COUNT,
      recordCount: HEALTH_RECORD_COUNT,
    };

    logger.info('Benchmark complete', result);
    return result;
  }
}

export const performanceMonitor = new PerformanceMonitor();
