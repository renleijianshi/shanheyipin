#!/usr/bin/env bash
# Codespaces / devcontainer 首次创建后的初始化
set -euo pipefail

echo ">>> Node $(node -v) · npm $(npm -v)"

# 依赖安装。package.json 的 postinstall 会自动执行 prisma generate，
# 所以这里不用再单独跑 db:generate。
echo ">>> 安装依赖 (npm ci)"
npm ci

# .env 在 .gitignore 里，从模板起个头。
# 真实密钥请配置成 Codespaces Secrets，不要写进仓库。
if [ ! -f .env ]; then
  cp .env.example .env
  echo ">>> 已由 .env.example 生成 .env（其中的占位值请按需替换，切勿提交）"
else
  echo ">>> .env 已存在，跳过"
fi

# 仓库级 .git/config 不会随 clone 过来，容器里也没有全局身份，
# 不配的话第一次 commit 就会失败。用已认证的 gh 取 GitHub 用户名。
if [ -z "$(git config --global user.name 2>/dev/null || true)" ]; then
  gh_user="$(gh api user --jq .login 2>/dev/null || true)"
  if [ -n "$gh_user" ]; then
    git config --global user.name "$gh_user"
    git config --global user.email "${gh_user}@users.noreply.github.com"
    echo ">>> git 身份已设为 ${gh_user}"
  else
    echo ">>> 未能获取 GitHub 用户名，请手动执行 git config user.name / user.email"
  fi
fi

# 容器内 workspace 归属可能与 git 期望不一致，避免 dubious ownership 报错
git config --global --add safe.directory "$(pwd)" >/dev/null 2>&1 || true

echo ""
echo ">>> 环境就绪。常用命令："
echo "    npm run check      # lint + typecheck + test + build 一次跑完"
echo "    npm test           # 仅测试"
echo "    npm run typecheck  # 仅类型检查"
