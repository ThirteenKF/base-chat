#!/bin/bash
set -e

# Vercel уже устанавливает зависимости перед сборкой,
# поэтому здесь просто запускаем production build.
npm run build