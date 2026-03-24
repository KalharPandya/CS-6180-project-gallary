#!/usr/bin/env node
'use strict';
const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const TEAMS = [
  { n:  1, name: 'Team 01', title: 'Automating vehicle damage assessment in the insurance industry',                                                                  members: ['Vishwajeet Hogale', 'Anjali Pai', 'Nitya Ravi'] },
  { n:  2, name: 'Team 02', title: 'Evaluating Hallucination Detection in Financial RAG',                                                                              members: ['Rudrajit Banerjee', 'Bijin Chakraborty', 'Mirat Shah'] },
  { n:  3, name: 'Team 03', title: 'Evaluating Hallucination Behavior in Retrieval-Augmented Generation Systems',                                                     members: ['Arzoo Jiwani', 'Rahul Abhijit Kulkarni', 'Yashi Chawla'] },
  { n:  4, name: 'Team 04', title: 'Comparative Study of Classical, Graph-Based, and LLM-Guided Video Summarization on TVSum and SumMe',                             members: ['Hariharan Chandrasekar', 'Niranjan Sathish', 'Saumith Devarasetty'] },
  { n:  5, name: 'Team 05', title: 'FinChartAudit: Detecting Misleading Financial Charts with Vision-Language Models and Textual Grounding',                          members: ['Mengshan Li', 'Wenshuang Zhou', 'Tong Wu'] },
  { n:  6, name: 'Team 06', title: 'Comparing Prompting Strategies for Automatic Educational Quiz Generation',                                                         members: ['Mengru Li', 'Difan Xie', 'Sizhi Chen'] },
  { n:  7, name: 'Team 07', title: 'MarketLens: Turning Financial News into Actionable Market Intelligence',                                                           members: ['Anandavardhana Hegde', 'Yogesh Thakku Suresh', 'Ayush Sharma'] },
  { n:  8, name: 'Team 08', title: 'Agentic RAG: Evaluating Tool Routing Accuracy Under Prompt Ambiguity',                                                            members: ['Parin Shah', 'Henil Himanshukumar Patel', 'Heta Milan Shah'] },
  { n:  9, name: 'Team 09', title: 'FinAgent: Multi-Agent System for Automated Financial Risk Screening',                                                              members: ['Sumit Kanu', 'Om Mane', 'Sharan Giri'] },
  { n: 10, name: 'Team 10', title: 'LLM Agent Self-Correction: Do Agents Actually Fix Their Mistakes?',                                                               members: ['Manav Kamleshbhai Dhamani', 'Shrey Babulal Patel', 'Aditya Chatterjee'] },
  { n: 11, name: 'Team 11', title: 'Detecting Hallucination in Large Language Models via Internal Circuit Activations',                                                members: ['Siddhartha Roy', 'Akshita Singh', 'Prabesh Paudel'] },
  { n: 12, name: 'Team 12', title: 'RAGs for Trading: Evaluating Retrieval-Augmented Generation for Structured Financial Signal Analysis',                            members: ['Ricky Lee', 'Tarun Badarvada', 'Dina Barua'] },
  { n: 13, name: 'Team 13', title: 'Beyond Naive RAG: Progressive Retrieval Enhancements and Adversarial Verification for Faithful Legal AI',                         members: ['Sri Ram Sathiya Narayanan', 'Mohammed Ahnaf Tajwar', 'Sivapriya Sugumaran'] },
  { n: 14, name: 'Team 14', title: 'Lost in Simplification: Detecting Safety-Critical Errors in LLM-Generated Medication Instructions',                               members: ['Rohit Abhijit Kulkarni', 'Atharv Talnikar', 'Christopher Huitt'] },
  { n: 15, name: 'Team 15', title: 'AI Financial Document Analyzer: Generating Spending Insights Using Retrieval-Augmented Generation',                               members: ['Calvin Kim', 'Takara Truong', 'Chimiddorj Ulziisaikhan'] },
  { n: 16, name: 'Team 16', title: 'Selective Debate-Augmented RAG: Efficient Hallucination Detection via Asymmetric Agents and DSPy-Optimized Adjudication',         members: ['Shrivarshini Narayanan', 'Shivam Singh', 'Bhanu Harsha Yanamadala'] },
  { n: 17, name: 'Team 17', title: 'Agentic Data Analysis',                                                                                                           members: ['Jicheng Li', 'Ziyue Shen', 'Nathanael Chiang'] },
  { n: 18, name: 'Team 18', title: 'Does Fine-Tuning Make Small LLMs More Robust? Testing Tool-Calling and Fault Recovery in Gemma 2B vs. Phi-3 Mini',               members: ['Sam Selvaraj', 'Jatan Nitesh Patel', 'Silas Bates'] },
  { n: 19, name: 'Team 19', title: 'Evaluating an Automated Generative AI Pipeline for News-to-Video Creation',                                                       members: ['Ran Zhao', 'Xiaofan Guo', 'Zhuoren Zhou'] },
  { n: 20, name: 'Team 20', title: 'FinSearch: Intent-Aware Financial Document Intelligence',                                                                          members: ['Moumita Baidya', 'Nidhi Vinodbhai Patel', 'Kirubhaharan Joseph Abraham'] },
  { n: 21, name: 'Team 21', title: 'Beyond Semantics: Bridging the Gap in Mental Health Dialogue via Emotion-Driven RAG and Safety Guardrails',                       members: ['Chenchen Feng', 'Wenwen Han', 'Vesper Wang'] },
  { n: 22, name: 'Team 22', title: 'Comparative Study of Vision Language Models for Multimodal Fashion Search',                                                        members: ['Aatmaj Amol Salunke', 'Chandan Gowda Keelara Shivanna', 'Sai Ritish Reddy Musku'] },
  { n: 23, name: 'Team 23', title: 'Macroeconomic research synthesis with Gen AI',                                                                                    members: ['Tianyiru Chen', 'Christopher Gormley', 'Sean Ando'] },
  { n: 24, name: 'Team 24', title: 'Sensor-Aware Vision-Language Model Prompting for Accessible Scene Description',                                                   members: ['Yixi Jin', 'Pauline Truong', 'Tianze Yin'] },
  { n: 25, name: 'Team 25', title: 'Evaluating Temporal and Source-Aware RAG in Dynamic Knowledge Environments',                                                      members: ['Walgama Kankanamge Ashen De Silva', 'Nicholas Tietje', 'Katie Elyse Song'] },
  { n: 26, name: 'Team 26', title: 'From Dialogue to Data: Converting Patient-Doctor Conversations into SQL-Compatible Clinical Notes',                                members: ['Bridget Leary', 'Elisabeth Sluchak', 'Priyam Bhardwaj'] },
  { n: 27, name: 'Team 27', title: 'Renters Legal Assistance Chatbot',                                                                                                members: ['Maxwell Berry', 'En-Ping Su'] },
  { n: 28, name: 'Team 28', title: 'Generative Engine Optimization: Measuring and Improving Brand Visibility Across LLM Platforms',                                   members: ['Uday Sonawane', 'Divit Pratap Singh'] },
  { n: 29, name: 'Team 29', title: 'A RAG-Powered Intelligent Guide for Local Discovery',                                                                             members: ['Jeffrey Chen', 'Sai Manichandana Devi Thumati', 'Vishal Kumar'] },
  { n: 30, name: 'Team 30', title: 'Exploring the Impact of the Domain Specific Embeddings on Retrieval Augmented Generation (RAG) Performance',                      members: ['Sining Meng', 'Gokulraj Muthukumar', 'Deepashree Srinivasa Rao Rannore'] },
  { n: 31, name: 'Team 31', title: 'PaperPilot: Multi-Agent Research Assistant',                                                                                      members: ['Justin Trinh', 'Ankith Seethesh Vaidya', 'Sunidi Vijayakrishna Kumar'] },
  { n: 32, name: 'Team 32', title: 'Optimizing LLM-Generated Assessments',                                                                                            members: ['Shantanu Shashank Dharmadhikari'] },
];

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CS 6180 \u2014 Project Viewer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../styles/main.css">
  <link rel="stylesheet" href="../../styles/viewer.css">
</head>
<body>
  <script src="../../js/viewer.js"></script>
</body>
</html>
`;

let created = 0, updated = 0;

for (const team of TEAMS) {
  const slug   = `team-${String(team.n).padStart(2, '0')}`;
  const dir    = path.join(ROOT, 'teams', slug);
  const assets = path.join(dir, 'assets');

  fs.mkdirSync(assets, { recursive: true });

  // index.html — always write (idempotent)
  fs.writeFileSync(path.join(dir, 'index.html'), INDEX_HTML);

  // project.json — preserve existing assets fields if project.json already exists
  const jsonPath = path.join(dir, 'project.json');
  let existing = {};
  if (fs.existsSync(jsonPath)) {
    try { existing = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); } catch {}
    updated++;
  } else {
    created++;
  }

  const meta = {
    name:        team.name,
    title:       team.title,
    members:     team.members,
    description: existing.description || '',
    thumbnail:   existing.thumbnail   || null,
    poster:      existing.poster      !== undefined ? existing.poster  : 'assets/poster.pdf',
    video:       existing.video       !== undefined ? existing.video   : 'assets/video.mp4',
    tags:        existing.tags        || [],
  };

  fs.writeFileSync(jsonPath, JSON.stringify(meta, null, 2) + '\n');
}

console.log(`Done. Created: ${created}, Updated: ${updated}. Total: ${TEAMS.length} teams.`);
