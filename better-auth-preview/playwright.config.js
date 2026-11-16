import { existsSync } from 'node:fs';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'test',workers:1,timeout:180000,retries:0,reporter:'line',
  use:{trace:'off',screenshot:'off',video:'off'}});
