CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  remote BOOLEAN NOT NULL DEFAULT false,
  employment_type TEXT NOT NULL DEFAULT 'Full-time',
  salary_min INTEGER,
  salary_max INTEGER,
  seniority TEXT,
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'internal',
  external_id TEXT,
  external_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX jobs_source_external_id_key ON public.jobs (source, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX jobs_active_idx ON public.jobs (is_active);

GRANT SELECT ON public.jobs TO anon;
GRANT SELECT ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Job listings are publicly readable" ON public.jobs FOR SELECT TO anon, authenticated USING (is_active);

CREATE TABLE public.match_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  location TEXT NOT NULL,
  resume_filename TEXT,
  profile JSONB NOT NULL,
  matches JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX match_runs_user_id_idx ON public.match_runs (user_id);

GRANT ALL ON public.match_runs TO service_role;
ALTER TABLE public.match_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can read their own match runs" ON public.match_runs FOR SELECT TO authenticated USING (auth.uid() = user_id);
INSERT INTO public.jobs (title, company, location, remote, employment_type, salary_min, salary_max, seniority, required_skills, description) VALUES
('Senior Frontend Engineer','Northwind Labs','San Francisco, CA',false,'Full-time',165000,205000,'Senior',ARRAY['React','TypeScript','CSS','Testing','Accessibility']::text[],'Own the component architecture for a design-system-driven product used by thousands of teams. You will lead frontend performance work, mentor two mid-level engineers, and partner closely with design on complex interaction patterns.'),
('Frontend Engineer','Brightwave','Austin, TX',true,'Full-time',120000,150000,'Mid',ARRAY['React','JavaScript','REST APIs','Git']::text[],'Build and ship customer-facing features across our web app. Expect a fast release cadence, strong code review culture, and direct contact with the customers using what you build.'),
('Full Stack Engineer','Ledgerly','New York, NY',false,'Full-time',140000,180000,'Mid',ARRAY['Node.js','React','PostgreSQL','AWS']::text[],'Work across the stack on a fintech ledger platform. You will design APIs, model financial data, and keep a high bar for correctness and auditability.'),
('Backend Engineer','Kestrel Systems','Seattle, WA',true,'Full-time',150000,190000,'Senior',ARRAY['Go','PostgreSQL','Kubernetes','gRPC','Distributed Systems']::text[],'Design and operate the services behind a high-throughput logistics platform. Strong focus on reliability, observability, and pragmatic distributed-systems tradeoffs.'),
('Junior Software Engineer','Cobalt Row','Chicago, IL',false,'Full-time',85000,105000,'Junior',ARRAY['JavaScript','Python','SQL','Git']::text[],'A structured first engineering role with formal mentorship, paired programming, and a rotation across three product teams during your first year.'),
('Staff Software Engineer','Halcyon Health','Boston, MA',true,'Full-time',200000,250000,'Staff',ARRAY['System Design','Python','AWS','Leadership','Security']::text[],'Set technical direction across a healthcare data platform. You will lead architecture reviews, drive multi-quarter initiatives, and raise the engineering bar org-wide.'),
('Machine Learning Engineer','Vantage AI','San Francisco, CA',false,'Full-time',175000,220000,'Senior',ARRAY['Python','PyTorch','MLOps','SQL','Model Evaluation']::text[],'Take models from notebook to production: training pipelines, evaluation harnesses, and low-latency inference for a recommendation product.'),
('Data Engineer','Meridian Retail','Dallas, TX',true,'Full-time',130000,165000,'Mid',ARRAY['Python','dbt','Snowflake','Airflow','SQL']::text[],'Own the ingestion and transformation layer feeding analytics and forecasting for a national retail chain.'),
('Data Analyst','Foxglove Media','Los Angeles, CA',false,'Full-time',85000,110000,'Mid',ARRAY['SQL','Excel','Tableau','Statistics']::text[],'Turn audience and subscription data into decisions. You will build dashboards, run cohort analyses, and present findings to editorial leadership.'),
('Analytics Engineer','Tidepool Commerce','Remote',true,'Full-time',125000,155000,'Mid',ARRAY['dbt','SQL','Python','Data Modeling']::text[],'Sit between data engineering and analytics, owning the semantic layer and metric definitions the whole company relies on.'),
('Product Designer','Ora Studio','New York, NY',false,'Full-time',120000,155000,'Mid',ARRAY['Figma','Prototyping','User Research','Design Systems']::text[],'Design end-to-end product flows for a B2B scheduling tool, from research through polished, shippable interfaces.'),
('Senior Product Designer','Northwind Labs','Remote',true,'Full-time',150000,185000,'Senior',ARRAY['Figma','Design Systems','Interaction Design','User Research','Accessibility']::text[],'Lead design for a major surface area, define the interaction language, and partner with engineering on a shared design system.'),
('UX Researcher','Halcyon Health','Boston, MA',false,'Full-time',115000,145000,'Mid',ARRAY['User Research','Usability Testing','Interviewing','Survey Design']::text[],'Run generative and evaluative research with clinicians and patients, and translate it into concrete product direction.'),
('Product Manager','Ledgerly','New York, NY',false,'Full-time',145000,180000,'Mid',ARRAY['Roadmapping','Analytics','Stakeholder Management','SQL']::text[],'Own a core payments surface: define the roadmap, write crisp specs, and make hard prioritization calls with real revenue impact.'),
('Senior Product Manager','Kestrel Systems','Seattle, WA',true,'Full-time',170000,210000,'Senior',ARRAY['Product Strategy','Roadmapping','Data Analysis','Leadership']::text[],'Set strategy for our carrier network products and lead a pod of engineers and designers through ambiguous, high-stakes work.'),
('Technical Program Manager','Vantage AI','San Francisco, CA',false,'Full-time',150000,185000,'Senior',ARRAY['Program Management','Cross-functional Leadership','Risk Management','Agile']::text[],'Coordinate multi-team ML infrastructure programs, keep dependencies visible, and unblock delivery across four engineering groups.'),
('DevOps Engineer','Cobalt Row','Chicago, IL',true,'Full-time',135000,170000,'Mid',ARRAY['Terraform','AWS','CI/CD','Docker','Linux']::text[],'Own infrastructure-as-code, deployment pipelines, and on-call tooling for a platform serving millions of daily requests.'),
('Site Reliability Engineer','Kestrel Systems','Remote',true,'Full-time',155000,195000,'Senior',ARRAY['Kubernetes','Observability','Go','Incident Response','Linux']::text[],'Drive reliability targets, lead incident response, and eliminate toil across a growing service fleet.'),
('Security Engineer','Ledgerly','Remote',true,'Full-time',160000,200000,'Senior',ARRAY['AppSec','Threat Modeling','Cloud Security','Python']::text[],'Embed with product teams to threat-model new features, run our vulnerability program, and harden a regulated financial platform.'),
('QA Automation Engineer','Brightwave','Austin, TX',false,'Full-time',100000,130000,'Mid',ARRAY['Playwright','TypeScript','CI/CD','Test Strategy']::text[],'Build the automated test suite that lets us ship daily with confidence, and own quality strategy alongside product engineers.'),
('Mobile Engineer (iOS)','Foxglove Media','Los Angeles, CA',false,'Full-time',140000,175000,'Mid',ARRAY['Swift','SwiftUI','iOS','REST APIs']::text[],'Build the flagship iOS reading experience, with heavy emphasis on offline support, performance, and typography.'),
('Android Engineer','Tidepool Commerce','Remote',true,'Full-time',135000,170000,'Mid',ARRAY['Kotlin','Android','Jetpack Compose','REST APIs']::text[],'Own major features in a shopping app used daily by hundreds of thousands of customers.'),
('Growth Marketing Manager','Brightwave','Austin, TX',true,'Full-time',110000,140000,'Mid',ARRAY['SEO','Paid Acquisition','Analytics','A/B Testing','Copywriting']::text[],'Own the top of the funnel: paid channels, landing page experiments, and lifecycle campaigns with clear CAC targets.'),
('Content Marketing Lead','Ora Studio','Remote',true,'Full-time',115000,145000,'Senior',ARRAY['Content Strategy','SEO','Editing','Copywriting']::text[],'Build the editorial engine: strategy, a freelance bench, and a publishing cadence that actually drives pipeline.'),
('Product Marketing Manager','Vantage AI','San Francisco, CA',false,'Full-time',135000,170000,'Mid',ARRAY['Positioning','Messaging','Competitive Analysis','Launch Management']::text[],'Own positioning and launches for our enterprise AI products, and be the bridge between product, sales, and customers.'),
('Account Executive','Meridian Retail','Dallas, TX',false,'Full-time',90000,130000,'Mid',ARRAY['B2B Sales','Negotiation','CRM','Pipeline Management']::text[],'Run full-cycle enterprise sales into retail operations teams, with a mix of inbound pipeline and targeted outbound.'),
('Customer Success Manager','Tidepool Commerce','Remote',true,'Full-time',85000,110000,'Mid',ARRAY['Account Management','Onboarding','SaaS','Communication']::text[],'Own a book of mid-market accounts from onboarding through renewal, and be the internal voice of the customer.'),
('Technical Support Engineer','Cobalt Row','Chicago, IL',true,'Full-time',75000,100000,'Junior',ARRAY['Troubleshooting','SQL','APIs','Customer Communication']::text[],'Debug real customer issues across APIs and integrations, and turn recurring pain into documentation and product fixes.'),
('Operations Manager','Meridian Retail','Dallas, TX',false,'Full-time',95000,125000,'Mid',ARRAY['Process Design','Vendor Management','Excel','Logistics']::text[],'Keep regional distribution running: vendor relationships, throughput metrics, and continuous process improvement.'),
('People Operations Lead','Ora Studio','New York, NY',false,'Full-time',110000,140000,'Senior',ARRAY['HR Operations','Onboarding','Compensation','Policy']::text[],'Build the people function for a growing studio: hiring operations, onboarding, and compensation frameworks.'),
('Financial Analyst','Ledgerly','New York, NY',false,'Full-time',95000,125000,'Mid',ARRAY['Financial Modeling','Excel','SQL','Forecasting']::text[],'Own recurring revenue forecasting and scenario modeling, and partner with department leads on budget planning.'),
('Data Scientist','Halcyon Health','Remote',true,'Full-time',145000,185000,'Senior',ARRAY['Python','Statistics','SQL','Experimentation','Machine Learning']::text[],'Design experiments and predictive models on clinical outcomes data, and communicate findings to non-technical stakeholders.'),
('Solutions Architect','Kestrel Systems','Seattle, WA',true,'Full-time',160000,200000,'Senior',ARRAY['Cloud Architecture','AWS','Pre-sales','Integrations','Communication']::text[],'Partner with enterprise prospects to design integrations, run technical evaluations, and de-risk large deployments.'),
('Engineering Manager','Brightwave','Austin, TX',false,'Full-time',180000,225000,'Manager',ARRAY['People Management','System Design','Hiring','Agile']::text[],'Lead a team of seven engineers: growth and performance, delivery predictability, and technical strategy for your area.'),
('Graphic Designer','Foxglove Media','Los Angeles, CA',false,'Contract',70000,95000,'Junior',ARRAY['Adobe Creative Suite','Typography','Branding','Layout']::text[],'Produce editorial and campaign design across print and digital for a fast-moving media brand.'),
('Technical Writer','Vantage AI','Remote',true,'Full-time',100000,130000,'Mid',ARRAY['Technical Writing','APIs','Markdown','Developer Experience']::text[],'Own developer documentation end to end: API references, tutorials, and the information architecture that holds them together.');