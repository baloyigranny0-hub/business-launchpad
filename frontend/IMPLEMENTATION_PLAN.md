# Business Launchpad - Implementation Plan

## Overview
This document outlines the architecture blueprint for the South African compliance-focused business onboarding system.

---

## Step 1: File Structure & Core Configurations

### 1. Onboarding Types (`src/types/onboarding.ts`)
Extended TypeScript interfaces to capture South African compliance details.

### 2. Compliance Engine (`src/lib/complianceEngine.ts`)
Automated compliance mapping that assigns tier-1 (foundation) and tier-2 (industry-specific) compliance steps based on industry and province selection.

---

## Step 2: Automation & Integration Layer

### 1. Compliance Engine Architecture
- Tier 1: Ground Foundation (Mandatory for all SA Businesses)
  - CIPC Registration
  - SARS Tax Registration
  - B-BBEE Affidavit Generation

- Tier 2: Industry-Specific Regulations
  - Food & Beverage: Health permits
  - Mining: DMRE permits & environmental authorizations
  - Construction: CIDB registration
  - Tech/SaaS: Data protection compliance

### 2. Open Banking & Bankability Engine (`src/lib/bankability.ts`)
Financial cash flow verification integrated with Stitch API for bankability scoring.

---

## Step 3: Frontend Components

### DepartmentCard Component (`src/components/DepartmentCard.tsx`)
Renders institutional contact details with integrated Google Maps for location visualization.

---

## Step 4: Integration Endpoints

- `/api/cipc/register` - CIPC registration automation
- `/api/sars/verify` - SARS tax verification
- `/api/documents/bbbee-generate` - B-BBEE affidavit generation
- `/api/stitch/bankability` - Bankability scoring

---

## Transition to Lovable

Once all files are committed, import this repository into Lovable via GitHub integration and use the automation prompts to build out the full Edge Functions and live API handlers.
