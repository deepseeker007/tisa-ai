'use client';

/**
 * useIndexedDB — TISA Local Persistence
 *
 * Stores all chat history, documents, embeddings, and flashcards
 * in IndexedDB using the 'idb' library. Zero server contact.
 */

import { useEffect, useState, useCallback } from 'react';
import { openDB, type IDBPDatabase } from 'idb';
import type { Message, UploadedDoc, FlashCard } from '@/lib/types';

const DB_NAME = 'TISAdb';
const DB_VERSION = 1;

type TISAStore = {
  messages: Message;
  documents: UploadedDoc;
  flashcards: FlashCard;
  embeddings: { id: string; docId: string; chunkIdx: number; vector: number[] };
};

let dbInstance: IDBPDatabase<TISAStore> | null = null;

async function getDB(): Promise<IDBPDatabase<TISAStore>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<TISAStore>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Messages store
      if (!db.objectStoreNames.contains('messages')) {
        const store = db.createObjectStore('messages', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
      }
      // Documents store
      if (!db.objectStoreNames.contains('documents')) {
        db.createObjectStore('documents', { keyPath: 'id' });
      }
      // Flashcards store
      if (!db.objectStoreNames.contains('flashcards')) {
        const fc = db.createObjectStore('flashcards', { keyPath: 'id' });
        fc.createIndex('nextReview', 'nextReview');
      }
      // Embeddings store (for RAG)
      if (!db.objectStoreNames.contains('embeddings')) {
        const emb = db.createObjectStore('embeddings', { keyPath: 'id' });
        emb.createIndex('docId', 'docId');
      }
    },
  });

  return dbInstance;
}

export function useIndexedDB() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getDB().then(() => setReady(true)).catch(console.error);
  }, []);

  // ── Messages ───────────────────────────────────────────────
  const saveMessage = useCallback(async (msg: Message) => {
    const db = await getDB();
    await db.put('messages', msg);
  }, []);

  const loadMessages = useCallback(async (): Promise<Message[]> => {
    const db = await getDB();
    return db.getAllFromIndex('messages', 'timestamp');
  }, []);

  const clearMessages = useCallback(async () => {
    const db = await getDB();
    await db.clear('messages');
  }, []);

  // ── Documents / RAG ────────────────────────────────────────
  const saveDocument = useCallback(async (doc: UploadedDoc) => {
    const db = await getDB();
    await db.put('documents', doc);
  }, []);

  const loadDocuments = useCallback(async (): Promise<UploadedDoc[]> => {
    const db = await getDB();
    return db.getAll('documents');
  }, []);

  const deleteDocument = useCallback(async (id: string) => {
    const db = await getDB();
    await db.delete('documents', id);
    // Also remove associated embeddings
    const tx = db.transaction('embeddings', 'readwrite');
    const idx = tx.store.index('docId');
    let cursor = await idx.openCursor(IDBKeyRange.only(id));
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  }, []);

  // ── Embeddings ─────────────────────────────────────────────
  const saveEmbeddings = useCallback(async (
    docId: string,
    chunks: string[],
    vectors: number[][]
  ) => {
    const db = await getDB();
    const tx = db.transaction('embeddings', 'readwrite');
    for (let i = 0; i < chunks.length; i++) {
      await tx.store.put({
        id: `${docId}-${i}`,
        docId,
        chunkIdx: i,
        vector: vectors[i],
      });
    }
    await tx.done;
  }, []);

  const loadEmbeddingsForDoc = useCallback(async (docId: string) => {
    const db = await getDB();
    return db.getAllFromIndex('embeddings', 'docId', IDBKeyRange.only(docId));
  }, []);

  // ── Flashcards ─────────────────────────────────────────────
  const saveFlashcard = useCallback(async (card: FlashCard) => {
    const db = await getDB();
    await db.put('flashcards', card);
  }, []);

  const loadFlashcards = useCallback(async (): Promise<FlashCard[]> => {
    const db = await getDB();
    return db.getAll('flashcards');
  }, []);

  const updateFlashcardRating = useCallback(async (
    id: string,
    rating: FlashCard['rating']
  ) => {
    const db = await getDB();
    const card = await db.get('flashcards', id);
    if (!card) return;

    // Simple spaced repetition: hard=1d, okay=3d, easy=7d
    const days = { hard: 1, okay: 3, easy: 7 }[rating!] ?? 3;
    card.rating = rating;
    card.nextReview = Date.now() + days * 86_400_000;
    await db.put('flashcards', card);
  }, []);

  return {
    ready,
    saveMessage, loadMessages, clearMessages,
    saveDocument, loadDocuments, deleteDocument,
    saveEmbeddings, loadEmbeddingsForDoc,
    saveFlashcard, loadFlashcards, updateFlashcardRating,
  };
}
