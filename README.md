# Property Transformation Discovery Portal

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-2ea44f?logo=github)](https://aero-general.github.io/discovery/)
[![Repository](https://img.shields.io/badge/Repository-aero--general%2Fdiscovery-181717?logo=github)](https://github.com/aero-general/discovery)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A browser-based discovery and assessment portal for property owners, landlords, building managers, investors and property-service operators.

The application converts an initial stakeholder conversation into a structured digital-transformation assessment, including:

- business and portfolio context;
- operational priorities;
- risk exposure;
- technology maturity;
- capability requirements;
- an executive readiness report;
- recommended first-phase implementation scope; and
- downloadable assessment data.

## Live Demonstration

Open the deployed portal:

**https://aero-general.github.io/discovery/**

## Purpose

The portal supports early-stage discovery for a proposed digital property operating platform. It is designed to help stakeholders evaluate how property portfolios can be marketed, occupied, managed, maintained, secured and financially controlled through one integrated digital ecosystem.

The broader platform vision is an asset-light, technology-enabled property operating model that helps property owners improve occupancy, rental collection, operational control and portfolio performance without requiring the platform provider to own the underlying properties.

## Current Capabilities

The current demonstration provides a guided, multi-stage assessment covering:

1. **Initial Contact**  
   Captures stakeholder, business and property-portfolio context.

2. **Needs Analysis**  
   Identifies operational pain points, commercial priorities and first-90-day requirements.

3. **Risk Analysis**  
   Assesses legal, financial, operational, privacy, cybersecurity and service-delivery risks.

4. **Technology Maturity**  
   Reviews the current use of spreadsheets, WhatsApp, accounting systems, cloud storage, property software, CRM, payments, analytics and integrations.

5. **Capability Confirmation**  
   Confirms the preferred pilot scope, implementation priorities and operating model.

6. **Executive Output**  
   Produces a dashboard with readiness scores, priority risks, recommended capabilities and an executive summary.

## Outputs

After completing the assessment, the portal generates:

- technology maturity score;
- operational readiness score;
- risk exposure score;
- transformation opportunity score;
- executive assessment summary;
- recommended first-phase scope;
- priority risk indicators;
- capability profile;
- downloadable executive report; and
- downloadable JSON assessment data.

## Strategic Solution Areas

The discovery model is aligned to the following property-platform capability domains:

- property and unit portfolio management;
- rental and lease administration;
- listings and digital marketing;
- tenant applications and onboarding;
- rental invoicing and payment tracking;
- maintenance and facilities management;
- municipal and utility account monitoring;
- security and incident management;
- property valuation and inspections;
- document and compliance management;
- owner, tenant and service-provider portals;
- workflow automation and AI assistance; and
- portfolio analytics and management reporting.

## Recommended Initial Product Scope

The intended first implementation phase should focus on capabilities that provide immediate operational value:

- property and unit register;
- vacancy listings and digital marketing;
- tenant applications and onboarding;
- rental invoicing and payment tracking;
- maintenance request management;
- municipal account monitoring;
- owner performance dashboard; and
- WhatsApp-enabled communication workflows.

## Technology

The current implementation is deliberately lightweight:

- HTML5;
- CSS3;
- vanilla JavaScript;
- local browser-based scoring and rules;
- no application server required;
- no database required; and
- GitHub Pages for static hosting.

All application logic is currently contained in `index.html`.

## Repository Structure

```text
discovery/
├── .github/
│   └── workflows/        # GitHub Pages deployment workflow
├── index.html            # Complete interactive discovery portal
├── README.md             # Project documentation
└── LICENSE               # MIT licence
```

## Run Locally

### Option 1: Open directly

Clone the repository and open `index.html` in a modern browser.

```bash
git clone https://github.com/aero-general/discovery.git
cd discovery
```

Then open:

```text
index.html
```

### Option 2: Use a local web server

Using Node.js:

```bash
npx serve .
```

Using Python:

```bash
python -m http.server 8000
```

Then browse to:

```text
http://localhost:8000
```

## Deployment

The repository is configured for GitHub Pages deployment from the `main` branch through GitHub Actions.

A typical deployment flow is:

```bash
git add .
git commit -m "feat: update discovery portal"
git push origin main
```

GitHub Actions will publish the updated static site after the workflow completes successfully.

## Production Roadmap

The current portal is an interactive prototype. A production implementation should separate the user interface, business logic, data layer and integration services.

Recommended next-stage capabilities include:

- authenticated stakeholder and administrator access;
- persistent assessment records;
- multi-tenant data isolation;
- role-based access control;
- encrypted document storage;
- consent and POPIA audit trails;
- CRM and email integration;
- WhatsApp Business integration;
- digital report generation;
- workflow approvals;
- property and tenant master-data services;
- analytics dashboards;
- API-based integrations; and
- secure AI-generated summaries grounded in approved assessment data.

## Security and Privacy Considerations

Before processing real stakeholder, tenant or property data, the production platform should implement:

- explicit consent capture;
- data minimisation;
- role-based and least-privilege access;
- encryption in transit and at rest;
- secure secrets management;
- immutable audit logging;
- retention and deletion policies;
- backup and recovery controls;
- vulnerability scanning;
- dependency and supply-chain controls; and
- compliance with the Protection of Personal Information Act (POPIA).

The current static demonstration should not be used to collect sensitive or regulated information.

## Target Stakeholders

The discovery process is relevant to:

- property owners and investors;
- landlords;
- building and facilities managers;
- estate agencies;
- property developers;
- portfolio administrators;
- maintenance contractors;
- security providers;
- valuers and inspectors;
- financial and insurance partners; and
- technology implementation partners.

## Commercial Model Under Evaluation

The broader platform may support several revenue models:

- software subscription per property;
- fee per unit or tenant;
- managed property-service fees;
- tenant-placement commissions;
- listing and featured-advertising fees;
- rental collection fees;
- valuation and inspection fees;
- maintenance coordination fees;
- municipal account management fees;
- analytics subscriptions;
- referral income; and
- white-label platform licensing.

## Contributing

Contributions should be proposed through a feature branch and pull request.

```bash
git checkout -b feature/your-change
git add .
git commit -m "feat: describe the change"
git push origin feature/your-change
```

When proposing changes, include:

- the business requirement;
- the affected assessment stage;
- screenshots for user-interface changes;
- validation steps; and
- any privacy or security implications.

## Licence

This project is licensed under the [MIT License](LICENSE).

## Organisation

Developed under the **Aero & General Properties** initiative as a discovery foundation for a scalable digital property operating platform.
