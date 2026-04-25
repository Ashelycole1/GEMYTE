import type { LevelBlueprint } from '../types';

export async function parseKnowledgePayload(file: File, logCallback: (msg: string) => void): Promise<LevelBlueprint> {
  logCallback('Initiating RAG sequence...');
  await new Promise(resolve => setTimeout(resolve, 800));

  logCallback(`Reading file: ${file.name}`);
  await new Promise(resolve => setTimeout(resolve, 1500));

  logCallback('Extracting Semantic Nodes...');
  await new Promise(resolve => setTimeout(resolve, 1200));

  logCallback('Formulating Level Blueprint...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  logCallback('Blueprint synthesis complete.');

  return {
    environment: 'Circuit-Void',
    nodes: [
      { 
        id: 'n1', topic: 'Algorithm Complexity', 
        question: 'What is the time complexity of a binary search?', 
        options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
        correctAnswer: 'O(log n)',
        hint: 'It splits the data structure in half each step.',
        difficulty: 1 
      },
      { 
        id: 'n2', topic: 'Data Structures', 
        question: 'How do Hash Maps resolve collisions?', 
        options: ['Duplication', 'Chaining and Open Addressing', 'Discarding data', 'Vectorizing'],
        correctAnswer: 'Chaining and Open Addressing',
        hint: 'Think about linking lists to a single index or stepping to the next available slot.',
        difficulty: 2 
      },
      { 
        id: 'n3', topic: 'System Design', 
        question: 'What is the CAP theorem?', 
        options: ['Consistency, Availability, Partition tolerance', 'Compute, Availability, Protocol', 'Concurrency, Asynchronous, Partition', 'None of the above'],
        correctAnswer: 'Consistency, Availability, Partition tolerance',
        hint: 'It describes trade-offs in distributed systems.',
        difficulty: 3 
      },
      { 
        id: 'n4', topic: 'Machine Learning', 
        question: 'Define backpropagation.', 
        options: ['A sorting method', 'Gradient distribution of error backwards', 'Forward propagation multiplier', 'Data cleaning technique'],
        correctAnswer: 'Gradient distribution of error backwards',
        hint: 'It uses chain rule to adjust weights behind the input.',
        difficulty: 4 
      },
      { 
        id: 'n5', topic: 'Cybersecurity', 
        question: 'Explain the difference between Symmetric and Asymmetric encryption.', 
        options: ['Symmetric uses one key; Asymmetric uses a public/private pair', 'They are the same', 'Asymmetric is faster', 'Symmetric uses two keys'],
        correctAnswer: 'Symmetric uses one key; Asymmetric uses a public/private pair',
        hint: 'One method requires sharing a secret, the other safely publishes part of it.',
        difficulty: 2 
      }
    ]
  };
}
