import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';

const proofPoints = [
  { value: 'ZK', label: 'Browser-side encryption' },
  { value: '2', label: 'Cloud providers supported' },
  { value: '54', label: 'Documented API endpoints' },
  { value: '4', label: 'Delivered iterations' },
];

const segments = [
  {
    title: 'Privacy-conscious individuals',
    body: 'Personal users who want Dropbox or Google Drive convenience without giving providers readable file content.',
  },
  {
    title: 'Small professional practices',
    body: 'Legal, health, finance, and consulting teams that need controlled sharing, audit evidence, and clear security posture.',
  },
  {
    title: 'Security-aware students and developers',
    body: 'Technical users who value auditable architecture, standards-based cryptography, and transparent implementation choices.',
  },
];

const methodology = [
  'User-centred file workflows based on familiar cloud storage patterns.',
  'Privacy-by-design architecture with encryption before upload.',
  'Iterative delivery across foundation, encryption, sharing, and polish phases.',
  'Responsive dashboard design with dark mode, analytics, and progressive disclosure.',
];

function ProofStrip() {
  return (
    <section className="marketing-proof" aria-label="Product proof points">
      {proofPoints.map((item) => (
        <div className="marketing-proof__item" key={item.label}>
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </section>
  );
}

export default function Home() {
  const heroImage = useBaseUrl('/img/marketing-hero.png');

  return (
    <Layout
      title="Cipher Cloud"
      description="Zero-knowledge encrypted file storage that works with Dropbox and Google Drive."
    >
      <main className="marketing-home">
        <section className="marketing-hero">
          <img
            className="marketing-hero__image"
            src={heroImage}
            alt=""
            aria-hidden="true"
          />
          <div className="marketing-hero__shade" />
          <div className="marketing-hero__content">
            <p className="marketing-kicker">CSIT-321 Capstone Project</p>
            <h1>Cipher Cloud</h1>
            <p className="marketing-hero__lead">
              Zero-knowledge encrypted file storage for people and teams who need
              cloud convenience without provider-readable files.
            </p>
            <div className="marketing-actions">
              <Link className="button button--primary button--lg" to="/marketing">
                View marketing audit
              </Link>
              <Link className="button button--secondary button--lg" to="/technical-report">
                Technical report
              </Link>
            </div>
          </div>
        </section>

        <ProofStrip />

        <section className="marketing-section marketing-section--split">
          <div>
            <p className="marketing-kicker">Product Positioning</p>
            <h2>Your files are encrypted before they leave your browser.</h2>
            <p>
              Cipher Cloud sits above the storage accounts users already have. Files are
              encrypted client-side with browser-native cryptography, then stored as
              ciphertext in Dropbox or Google Drive. The application server manages
              identity, metadata, sharing, and audit events without handling plaintext
              file content.
            </p>
          </div>
          <div className="marketing-callout">
            <h3>Core promise</h3>
            <p>
              Cipher Cloud cannot read the user's files. The cloud provider cannot read
              the user's files. Only the file owner and explicitly approved recipients can
              decrypt shared content.
            </p>
          </div>
        </section>

        <section className="marketing-section">
          <p className="marketing-kicker">Target Market</p>
          <h2>Built for privacy-sensitive file workflows.</h2>
          <div className="marketing-card-grid">
            {segments.map((segment) => (
              <article className="marketing-card" key={segment.title}>
                <h3>{segment.title}</h3>
                <p>{segment.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="marketing-section marketing-section--band">
          <div>
            <p className="marketing-kicker">Design Methodology</p>
            <h2>Professional security, presented through familiar product patterns.</h2>
          </div>
          <ul className="marketing-checklist">
            {methodology.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="marketing-section marketing-section--split">
          <div>
            <p className="marketing-kicker">Development Environment</p>
            <h2>Modern full-stack implementation.</h2>
            <p>
              The product uses React 19, TypeScript, Vite, Tailwind CSS, Express 5,
              Node.js 20, MongoDB Atlas, Mongoose, Swagger/OpenAPI, Dropbox, Google
              APIs, Web Crypto, and Docusaurus for evaluator-facing documentation.
            </p>
          </div>
          <div className="marketing-stack">
            <span>React</span>
            <span>TypeScript</span>
            <span>Express</span>
            <span>MongoDB</span>
            <span>Web Crypto</span>
            <span>OpenAPI</span>
          </div>
        </section>
      </main>
    </Layout>
  );
}
