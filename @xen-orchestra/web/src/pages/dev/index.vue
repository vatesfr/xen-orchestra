<template>
  <div>
    <UiTaskList :tasks />
  </div>
</template>

<script setup lang="ts">
import UiTaskList from '@core/components/ui/task-list/UiTaskList.vue'

const tasks = [
  {
    id: '1',
    name: 'Import de données',
    userName: 'Alice',
    type: 'import',
    start: 1695628800000,
    end: 1695630600000,
    progress: 100,
    status: 'success',
    infos: [
      { data: { rows: 1200 }, message: '1200 lignes importées' },
      { data: null, message: 'Durée : 30 minutes' },
    ],
  },
  {
    id: '2',
    name: 'Analyse des logs',
    userName: 'Bob',
    type: 'analysis',
    start: 1695634200000,
    progress: 45,
    status: 'pending',
    infos: [{ data: { parsed: 600 }, message: '600 lignes analysées' }],
    warning: [
      {
        data: { file: 'server-1.log' },
        message: 'Certains fichiers contiennent des caractères invalides',
      },
    ],
    tasks: [
      {
        id: '2-1',
        name: 'Analyse partielle',
        start: 1695634200000,
        progress: 80,
        status: 'success',
        infos: [{ data: { parsed: 400 }, message: '400 lignes analysées' }],
      },
      {
        id: '2-2',
        name: 'Analyse complémentaire',
        start: 1695636000000,
        progress: 20,
        status: 'pending',
        infos: [{ data: { parsed: 200 }, message: '200 lignes analysées' }],
      },
    ],
  },
  {
    id: '3',
    name: 'Export vers CSV',
    userName: 'Charlie',
    type: 'export',
    start: 1695637800000,
    progress: 0,
    status: 'failure',
    infos: [{ data: null, message: 'Erreur lors de la génération du fichier' }],
    warning: [{ data: null, message: 'Espace disque faible' }],
    tasks: [
      {
        id: '2-2',
        name: 'Analyse complémentaire',
        start: 1695636000000,
        progress: 20,
        status: 'pending',
        infos: [{ data: { parsed: 200 }, message: '200 lignes analysées' }],
        tasks: [
          {
            id: '2-1',
            name: 'Analyse partielle',
            start: 1695634200000,
            progress: 80,
            status: 'success',
            infos: [{ data: { parsed: 400 }, message: '400 lignes analysées' }],
          },
          {
            id: '2-2',
            name: 'Analyse complémentaire',
            start: 1695636000000,
            progress: 20,
            status: 'pending',
            infos: [{ data: { parsed: 200 }, message: '200 lignes analysées' }],
            tasks: [
              {
                id: '2-1',
                name: 'Analyse partielle',
                start: 1695634200000,
                progress: 80,
                status: 'success',
                infos: [{ data: { parsed: 400 }, message: '400 lignes analysées' }],
              },
              {
                id: '2-2',
                name: 'Analyse complémentaire',
                start: 1695636000000,
                progress: 20,
                status: 'pending',
                infos: [{ data: { parsed: 200 }, message: '200 lignes analysées' }],
                tasks: [
                  {
                    id: '2-1',
                    name: 'Analyse partielle',
                    start: 1695634200000,
                    progress: 80,
                    status: 'success',
                    infos: [{ data: { parsed: 400 }, message: '400 lignes analysées' }],
                  },
                  {
                    id: '2-2',
                    name: 'Analyse complémentaire',
                    start: 1695636000000,
                    progress: 20,
                    status: 'pending',
                    infos: [{ data: { parsed: 200 }, message: '200 lignes analysées' }],
                    tasks: [
                      {
                        id: '2-1',
                        name: 'Analyse partielle',
                        start: 1695634200000,
                        progress: 80,
                        status: 'success',
                        infos: [{ data: { parsed: 400 }, message: '400 lignes analysées' }],
                      },
                      {
                        id: '2-2',
                        name: 'Analyse complémentaire',
                        start: 1695636000000,
                        progress: 20,
                        status: 'pending',
                        infos: [{ data: { parsed: 200 }, message: '200 lignes analysées' }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: '2-1',
        name: 'Analyse partielle',
        start: 1695634200000,
        progress: 80,
        status: 'success',
        infos: [{ data: { parsed: 400 }, message: '400 lignes analysées' }],
      },
    ],
  },
  {
    id: '4',
    name: 'Nettoyage des doublons',
    userName: 'Alice',
    type: 'cleanup',
    start: 1695641400000,
    end: 1695643200000,
    progress: 100,
    status: 'interrupted',
    infos: [
      { data: { removed: 150 }, message: '150 doublons supprimés' },
      { data: null, message: 'Opération stoppée par l’utilisateur' },
    ],
  },
]
</script>
