# SmartSpend v2 — Database Schema

> PostgreSQL 16. Все строковые идентификаторы в справочных таблицах используют `VARCHAR` для совместимости с существующими мок-данными; в пользовательских таблицах — `UUID`.

---

## UML-диаграмма (ERD)

```mermaid
erDiagram

    users {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar display_name
        char_2 initials
        char_7 color
        text bio
        varchar avatar_url
        user_status status
        theme_enum theme
        boolean sidebar_collapsed
        timestamptz joined_at
        timestamptz deleted_at
        timestamptz created_at
        timestamptz updated_at
    }

    user_finance {
        uuid user_id PK_FK
        int income
        int housing
        int credit
        int credit_months
        bigint capital
        numeric emo_rate
        timestamptz updated_at
    }

    follows {
        uuid follower_id PK_FK
        uuid following_id PK_FK
        timestamptz created_at
    }

    envelope_categories {
        varchar id PK
        varchar name
        char_7 color
    }

    inventory_groups {
        varchar id PK
        varchar name
        char_7 color
    }

    inventory_group_categories {
        varchar group_id PK_FK
        varchar category_id PK
    }

    sets {
        varchar id PK
        set_source source
        varchar category_id FK
        varchar set_type
        char_7 color
        varchar title
        text description
        int amount
        varchar amount_label
        int users_count
        date added
        boolean is_private
        uuid author_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    set_items {
        serial id PK
        varchar set_id FK
        varchar name
        varchar note
        numeric qty
        varchar unit
        numeric base_price
        numeric period_years
        varchar item_type
        timestamptz created_at
    }

    set_comments {
        serial id PK
        varchar set_id FK
        uuid user_id FK
        char_2 initials
        varchar name
        text text
        int likes_count
        int dislikes_count
        timestamptz created_at
    }

    articles {
        varchar id PK
        uuid author_id FK
        varchar title
        varchar article_type
        varchar category_id FK
        text preview
        date published_at
        article_status status
        int views_count
        int likes_count
        int dislikes_count
        varchar linked_set_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    article_blocks {
        serial id PK
        varchar article_id FK
        int position
        block_type type
        text text
        text html
        text_array items
        varchar title
    }

    article_comments {
        serial id PK
        varchar article_id FK
        uuid user_id FK
        char_2 initials
        varchar name
        text text
        int likes_count
        int dislikes_count
        timestamptz created_at
    }

    article_set_links {
        varchar article_id PK_FK
        uuid user_id PK_FK
        varchar set_id FK
        timestamptz created_at
    }

    reactions {
        serial id PK
        uuid user_id FK
        reaction_target target_type
        varchar target_id
        reaction_type type
        timestamptz created_at
    }

    envelopes {
        serial id PK
        uuid user_id FK
        varchar category_id FK
        varchar set_id FK
        varchar name
        int items_count
        int amount
        varchar envelope_type
        varchar period
        timestamptz created_at
        timestamptz updated_at
    }

    inventory_items {
        varchar id PK
        uuid user_id FK
        varchar group_id FK
        inv_type type
        varchar name
        int price
        varchar set_id FK
        boolean is_extra
        boolean paused
        numeric qty
        varchar unit
        numeric daily_use
        date last_bought
        int wear_life_weeks
        text notes
        timestamptz created_at
        timestamptz updated_at
    }

    inventory_purchases {
        serial id PK
        varchar item_id FK
        int position
        boolean bought
        date purchase_date
    }

    inventory_photos {
        serial id PK
        varchar item_id FK
        text url
        varchar file_name
        timestamptz created_at
    }

    notifications {
        serial id PK
        uuid user_id FK
        notif_type type
        varchar title
        text description
        boolean is_read
        timestamptz created_at
    }

    users ||--o| user_finance : "has"
    users ||--o{ follows : "follower"
    users ||--o{ follows : "following"
    users ||--o{ envelopes : "owns"
    users ||--o{ inventory_items : "owns"
    users ||--o{ reactions : "reacts"
    users ||--o{ notifications : "receives"
    users ||--o{ article_set_links : "links"
    users ||--o{ sets : "authored"
    users ||--o{ articles : "authored"
    users ||--o{ set_comments : "comments"
    users ||--o{ article_comments : "comments"

    envelope_categories ||--o{ envelopes : "categorises"
    envelope_categories ||--o{ sets : "categorises"
    envelope_categories ||--o{ articles : "categorises"

    inventory_groups ||--o{ inventory_items : "groups"
    inventory_groups ||--o{ inventory_group_categories : "maps"

    sets ||--o{ set_items : "contains"
    sets ||--o{ set_comments : "has"
    sets ||--o{ envelopes : "added_to"
    sets ||--o{ inventory_items : "source"
    sets ||--o{ article_set_links : "linked"
    sets |o--o{ articles : "linked_set"

    articles ||--o{ article_blocks : "has"
    articles ||--o{ article_comments : "has"
    articles ||--o{ article_set_links : "linked_to"

    inventory_items ||--o{ inventory_purchases : "purchases"
    inventory_items ||--o{ inventory_photos : "photos"
```

---

## ENUM-типы

```sql
CREATE TYPE user_status    AS ENUM ('unverified', 'verified', 'suspended', 'pending_deletion');
CREATE TYPE theme_enum     AS ENUM ('light', 'dark');
CREATE TYPE set_source     AS ENUM ('smartspend', 'community', 'own');
CREATE TYPE article_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE inv_type       AS ENUM ('consumable', 'wear');
CREATE TYPE reaction_target AS ENUM ('article', 'set', 'comment');
CREATE TYPE reaction_type  AS ENUM ('like', 'dislike');
CREATE TYPE block_type     AS ENUM ('p', 'h2', 'h3', 'ul', 'highlight', 'note', 'key_points');
CREATE TYPE notif_type     AS ENUM ('system', 'activity', 'recommendation');
```

---

## Справочные таблицы

```sql
-- ── Категории конвертов (Профиль → бюджет по категориям) ─────────────────────
CREATE TABLE envelope_categories (
    id    VARCHAR(20) PRIMARY KEY,  -- 'food', 'clothes', 'home', ...
    name  VARCHAR(80) NOT NULL,     -- 'Еда и Супермаркеты'
    color CHAR(7)     NOT NULL      -- '#8DBFA8'
);

INSERT INTO envelope_categories (id, name, color) VALUES
    ('all',       'Все покупки',            '#A8B8C8'),
    ('food',      'Еда и Супермаркеты',     '#8DBFA8'),
    ('cafe',      'Кафе, Бары, Рестораны',  '#C4A882'),
    ('clothes',   'Одежда и Обувь',         '#B8A0C8'),
    ('home',      'Дом и Техника',          '#9EA8C0'),
    ('health',    'Красота и Здоровье',     '#C4B0C0'),
    ('transport', 'Авто и Транспорт',       '#8AAFC8'),
    ('leisure',   'Развлечения и Хобби',    '#C8A8A0'),
    ('education', 'Образование и Дети',     '#A8C0B0'),
    ('travel',    'Путешествия и Отдых',    '#C0B898'),
    ('other',     'Прочие расходы',         '#B0A898');


-- ── Группы инвентаря (Инвентарь → визуальные группы) ─────────────────────────
CREATE TABLE inventory_groups (
    id    VARCHAR(5)  PRIMARY KEY,  -- 'g1'..'g8'
    name  VARCHAR(80) NOT NULL,
    color CHAR(7)     NOT NULL
);

INSERT INTO inventory_groups (id, name, color) VALUES
    ('g1', 'Одежда и Обувь',      '#B8A0C8'),
    ('g2', 'Еда и Супермаркеты',  '#8DBFA8'),
    ('g3', 'Дом и Техника',       '#9EA8C0'),
    ('g4', 'Красота и Здоровье',  '#C4B0C0'),
    ('g5', 'Авто и Транспорт',    '#8AAFC8'),
    ('g6', 'Развлечения и Хобби', '#C8A8A0'),
    ('g7', 'Образование и Дети',  '#A8C0B0'),
    ('g8', 'Прочие расходы',      '#B0A898');


-- ── Маппинг: группа инвентаря → категории конвертов ──────────────────────────
CREATE TABLE inventory_group_categories (
    group_id    VARCHAR(5)  NOT NULL REFERENCES inventory_groups(id),
    category_id VARCHAR(20) NOT NULL REFERENCES envelope_categories(id),
    PRIMARY KEY (group_id, category_id)
);

INSERT INTO inventory_group_categories VALUES
    ('g1','clothes'), ('g2','food'), ('g3','home'),
    ('g4','health'), ('g5','transport'), ('g6','leisure'),
    ('g7','education'), ('g8','other');
```

---

## Пользователи и финансы

```sql
-- ── Пользователи ──────────────────────────────────────────────────────────────
CREATE TABLE users (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email            VARCHAR(254) NOT NULL UNIQUE,
    password_hash    VARCHAR(255) NOT NULL,
    display_name     VARCHAR(100) NOT NULL,
    initials         CHAR(2)     NOT NULL,           -- 'АС', 'МЛ' — для аватара
    color            CHAR(7)     NOT NULL DEFAULT '#7DAF92', -- цвет аватара
    bio              TEXT,
    avatar_url       TEXT,
    status           user_status  NOT NULL DEFAULT 'unverified',
    theme            theme_enum   NOT NULL DEFAULT 'light',
    sidebar_collapsed BOOLEAN     NOT NULL DEFAULT FALSE,
    email_verified_at TIMESTAMPTZ,
    joined_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at       TIMESTAMPTZ,                    -- 7-дневный таймер удаления
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_status     ON users(status);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;


-- ── Финансовые данные пользователя ────────────────────────────────────────────
CREATE TABLE user_finance (
    user_id       UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    income        INT         NOT NULL DEFAULT 0,       -- ежемесячный доход, ₽
    housing       INT         NOT NULL DEFAULT 0,       -- расходы на жильё, ₽
    credit        INT         NOT NULL DEFAULT 0,       -- ежемесячный кредит, ₽
    credit_months INT         NOT NULL DEFAULT 0,       -- сколько месяцев осталось
    capital       BIGINT      NOT NULL DEFAULT 0,       -- размер капитала, ₽
    emo_rate      NUMERIC(4,2) NOT NULL DEFAULT 0.05,   -- ставка EmoSpend (0.03–0.10)
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── Подписки (автор → читатель) ───────────────────────────────────────────────
CREATE TABLE follows (
    follower_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id <> following_id)
);

CREATE INDEX idx_follows_following ON follows(following_id);
```

---

## Каталог наборов

```sql
-- ── Наборы (каталог) ──────────────────────────────────────────────────────────
CREATE TABLE sets (
    id           VARCHAR(20)  PRIMARY KEY,       -- 's1'..'s14', UUID для пользовательских
    source       set_source   NOT NULL,
    category_id  VARCHAR(20)  NOT NULL REFERENCES envelope_categories(id),
    set_type     VARCHAR(20)  NOT NULL DEFAULT 'base',  -- 'base', 'supplement'
    color        CHAR(7)      NOT NULL,
    title        VARCHAR(200) NOT NULL,
    description  TEXT,
    amount       INT,                            -- расчётная месячная стоимость, ₽
    amount_label VARCHAR(50),                    -- 'руб / месяц', 'руб / сезон'
    users_count  INT          NOT NULL DEFAULT 0,
    added        DATE,
    is_private   BOOLEAN      NOT NULL DEFAULT FALSE,
    author_id    UUID         REFERENCES users(id) ON DELETE SET NULL,
    -- SEO / about блок
    about_title  VARCHAR(200),
    about_text   TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_sets_source      ON sets(source);
CREATE INDEX idx_sets_category    ON sets(category_id);
CREATE INDEX idx_sets_author      ON sets(author_id) WHERE author_id IS NOT NULL;
CREATE INDEX idx_sets_created     ON sets(created_at DESC);


-- ── Позиции набора (расходники и вещи) ────────────────────────────────────────
CREATE TABLE set_items (
    id           SERIAL       PRIMARY KEY,
    set_id       VARCHAR(20)  NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
    name         VARCHAR(200) NOT NULL,
    note         VARCHAR(200),                   -- уточнение ('Демисезон + зима')
    qty          NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit         VARCHAR(20)  NOT NULL DEFAULT 'шт',  -- шт, пар, кг, л, мл, уп
    base_price   NUMERIC(10,2) NOT NULL,         -- цена за единицу, ₽
    period_years NUMERIC(6,4) NOT NULL,          -- период в годах (1/12 ≈ 0.0833 для месячника)
    item_type    VARCHAR(20)  NOT NULL DEFAULT 'consumable',  -- 'consumable' | 'wear'
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
-- Расчёт: monthly = (base_price × qty) / (period_years × 12)

CREATE INDEX idx_set_items_set ON set_items(set_id);


-- ── Комментарии к наборам ─────────────────────────────────────────────────────
CREATE TABLE set_comments (
    id           SERIAL       PRIMARY KEY,
    set_id       VARCHAR(20)  NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
    user_id      UUID         REFERENCES users(id) ON DELETE SET NULL,
    initials     CHAR(2)      NOT NULL,
    name         VARCHAR(100) NOT NULL,
    text         TEXT         NOT NULL,
    likes_count    INT        NOT NULL DEFAULT 0,
    dislikes_count INT        NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_set_comments_set ON set_comments(set_id, created_at DESC);
```

---

## Статьи

```sql
-- ── Статьи ────────────────────────────────────────────────────────────────────
CREATE TABLE articles (
    id             VARCHAR(20)    PRIMARY KEY,    -- 'f2', 'f4', UUID для новых
    author_id      UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title          VARCHAR(300)   NOT NULL,
    article_type   VARCHAR(50),                   -- 'Рецепт', 'Гайд', 'Разбор'
    category_id    VARCHAR(20)    REFERENCES envelope_categories(id),
    preview        TEXT,
    published_at   DATE,
    status         article_status NOT NULL DEFAULT 'draft',
    views_count    INT            NOT NULL DEFAULT 0,
    likes_count    INT            NOT NULL DEFAULT 0,
    dislikes_count INT            NOT NULL DEFAULT 0,
    linked_set_id  VARCHAR(20)    REFERENCES sets(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_articles_author     ON articles(author_id);
CREATE INDEX idx_articles_category   ON articles(category_id);
CREATE INDEX idx_articles_status     ON articles(status, published_at DESC);
CREATE INDEX idx_articles_linked_set ON articles(linked_set_id) WHERE linked_set_id IS NOT NULL;


-- ── Блоки контента статьи ─────────────────────────────────────────────────────
CREATE TABLE article_blocks (
    id         SERIAL      PRIMARY KEY,
    article_id VARCHAR(20) NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    position   SMALLINT    NOT NULL,
    type       block_type  NOT NULL,
    text       TEXT,                              -- для p, h2, h3
    html       TEXT,                              -- для highlight, note
    items      TEXT[],                            -- для ul, key_points (массив строк)
    title      VARCHAR(200),                      -- для key_points
    UNIQUE (article_id, position)
);

CREATE INDEX idx_article_blocks ON article_blocks(article_id, position);


-- ── Комментарии к статьям ─────────────────────────────────────────────────────
CREATE TABLE article_comments (
    id             SERIAL      PRIMARY KEY,
    article_id     VARCHAR(20) NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id        UUID        REFERENCES users(id) ON DELETE SET NULL,
    initials       CHAR(2)     NOT NULL,
    name           VARCHAR(100) NOT NULL,
    text           TEXT        NOT NULL,
    likes_count    INT         NOT NULL DEFAULT 0,
    dislikes_count INT         NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_article_comments ON article_comments(article_id, created_at DESC);


-- ── UC-39: Прикрепление статьи к набору пользователя ─────────────────────────
CREATE TABLE article_set_links (
    article_id VARCHAR(20) NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    set_id     VARCHAR(20) NOT NULL REFERENCES sets(id)     ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (article_id, user_id)
);

CREATE INDEX idx_article_set_links_set  ON article_set_links(set_id);
CREATE INDEX idx_article_set_links_user ON article_set_links(user_id);
```

---

## Реакции (лайки / дизлайки)

```sql
-- ── Реакции пользователей (наборы, статьи, комментарии) ──────────────────────
CREATE TABLE reactions (
    id          SERIAL          PRIMARY KEY,
    user_id     UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type reaction_target NOT NULL,
    target_id   VARCHAR(30)     NOT NULL,   -- id набора, статьи или комментария
    type        reaction_type   NOT NULL,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX idx_reactions_target ON reactions(target_type, target_id);
-- Счётчики likes_count / dislikes_count в основных таблицах обновляются триггером:

CREATE OR REPLACE FUNCTION sync_reaction_counts() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT','UPDATE') THEN
        IF NEW.target_type = 'article' THEN
            UPDATE articles SET
                likes_count    = (SELECT COUNT(*) FROM reactions WHERE target_type='article' AND target_id=NEW.target_id AND type='like'),
                dislikes_count = (SELECT COUNT(*) FROM reactions WHERE target_type='article' AND target_id=NEW.target_id AND type='dislike')
            WHERE id = NEW.target_id;
        ELSIF NEW.target_type = 'set' THEN
            UPDATE sets SET
                users_count = (SELECT COUNT(DISTINCT user_id) FROM envelopes WHERE set_id = NEW.target_id)
            WHERE id = NEW.target_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reactions_sync
AFTER INSERT OR UPDATE OR DELETE ON reactions
FOR EACH ROW EXECUTE FUNCTION sync_reaction_counts();
```

---

## Конверты (бюджет)

```sql
-- ── Конверты пользователя (набор → категория → месячная сумма) ────────────────
CREATE TABLE envelopes (
    id            SERIAL      PRIMARY KEY,
    user_id       UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    category_id   VARCHAR(20) NOT NULL REFERENCES envelope_categories(id),
    set_id        VARCHAR(20) NOT NULL REFERENCES sets(id)     ON DELETE CASCADE,
    name          VARCHAR(200) NOT NULL,
    items_count   INT         NOT NULL DEFAULT 0,
    amount        INT         NOT NULL DEFAULT 0,   -- месячная стоимость, ₽
    envelope_type VARCHAR(30) NOT NULL DEFAULT 'consumable',  -- 'consumable' | 'depreciation'
    period        VARCHAR(50),                      -- 'амортизация', 'смешанный'
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, set_id, category_id)
);

CREATE INDEX idx_envelopes_user     ON envelopes(user_id, category_id);
CREATE INDEX idx_envelopes_set      ON envelopes(set_id);
```

---

## Инвентарь

```sql
-- ── Позиции инвентаря (расходники + вещи) ────────────────────────────────────
CREATE TABLE inventory_items (
    -- Общие поля
    id               VARCHAR(60)  PRIMARY KEY,  -- 'inv_s1_1_1741234567890', 'i1'
    user_id          UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id         VARCHAR(5)   NOT NULL REFERENCES inventory_groups(id),
    type             inv_type     NOT NULL,
    name             VARCHAR(200) NOT NULL,
    price            INT          NOT NULL DEFAULT 0,  -- цена за единицу, ₽
    set_id           VARCHAR(20)  REFERENCES sets(id) ON DELETE SET NULL,
    is_extra         BOOLEAN      NOT NULL DEFAULT FALSE,  -- добавлен из набора
    paused           BOOLEAN      NOT NULL DEFAULT FALSE,  -- заморожен до активации
    notes            TEXT,

    -- Поля для consumable (расходник)
    qty              NUMERIC(10,2),  -- исходное количество (г, мл, шт)
    unit             VARCHAR(20),    -- 'г', 'мл', 'шт', 'уп'
    daily_use        NUMERIC(10,4),  -- расход в день
    last_bought      DATE,           -- дата последней покупки

    -- Поля для wear (вещь, износ)
    -- qty используется как количество экземпляров (целое)
    wear_life_weeks  INT,            -- срок службы в неделях

    -- Для legacy wear: одна дата покупки
    purchase_date    DATE,           -- NULL если multi-purchase

    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_consumable CHECK (
        type <> 'consumable' OR (qty IS NOT NULL AND daily_use IS NOT NULL AND last_bought IS NOT NULL)
    ),
    CONSTRAINT chk_wear CHECK (
        type <> 'wear' OR wear_life_weeks IS NOT NULL
    )
);

CREATE INDEX idx_inv_items_user  ON inventory_items(user_id, group_id);
CREATE INDEX idx_inv_items_set   ON inventory_items(set_id) WHERE set_id IS NOT NULL;
CREATE INDEX idx_inv_items_type  ON inventory_items(user_id, type);


-- ── Покупки для wear-позиций (multi-purchase) ─────────────────────────────────
-- Каждая строка = один слот покупки (1 вещь из N в карточке)
CREATE TABLE inventory_purchases (
    id            SERIAL      PRIMARY KEY,
    item_id       VARCHAR(60) NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    position      SMALLINT    NOT NULL,  -- порядковый номер (0-based)
    bought        BOOLEAN     NOT NULL DEFAULT FALSE,
    purchase_date DATE,                  -- NULL пока не куплено
    UNIQUE (item_id, position)
);

CREATE INDEX idx_inv_purchases_item ON inventory_purchases(item_id);


-- ── Фото к позициям инвентаря ─────────────────────────────────────────────────
CREATE TABLE inventory_photos (
    id         SERIAL      PRIMARY KEY,
    item_id    VARCHAR(60) NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    url        TEXT        NOT NULL,    -- S3 URL
    file_name  VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inv_photos_item ON inventory_photos(item_id);
```

---

## Уведомления

```sql
-- ── Уведомления ───────────────────────────────────────────────────────────────
CREATE TABLE notifications (
    id          SERIAL      PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        notif_type  NOT NULL,
    title       VARCHAR(200) NOT NULL,
    description TEXT        NOT NULL,
    is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_user ON notifications(user_id, is_read, created_at DESC);
```

---

## Вычисляемые формулы

| Метрика | Формула |
|---|---|
| Расход расходника в месяц | `(price / qty) × daily_use × 30` |
| Амортизация вещи в месяц | `price / (wear_life_weeks / 4.33)` |
| Итого набора в месяц | `Σ (base_price × qty) / (period_years × 12)` |
| Остаточная стоимость вещи | `price × max(0, 1 − weeks_used / wear_life_weeks)` |
| EmoSpend в месяц | `capital × emo_rate / 12` |
| Свободный остаток | `income − housing − credit − Σ конверты − Σ личный инвентарь` |
| Прирост капитала/мес. | `capital × 0.12 / 12` (BASE_RETURN = 12% годовых) |

---

## Ключевые связи (сводка)

```
users           1 ──── 1   user_finance
users           1 ──── ∞   follows            (follower / following)
users           1 ──── ∞   envelopes
users           1 ──── ∞   inventory_items
users           1 ──── ∞   reactions
users           1 ──── ∞   notifications
users           1 ──── ∞   sets               (authored)
users           1 ──── ∞   articles           (authored)

envelope_categories  1 ── ∞  sets
envelope_categories  1 ── ∞  articles
envelope_categories  1 ── ∞  envelopes

inventory_groups  1 ──── ∞  inventory_items
inventory_groups  1 ──── ∞  inventory_group_categories

sets            1 ──── ∞   set_items
sets            1 ──── ∞   set_comments
sets            1 ──── ∞   envelopes
sets            1 ──── ∞   inventory_items    (source set)
sets            1 ──── ∞   article_set_links

articles        1 ──── ∞   article_blocks
articles        1 ──── ∞   article_comments
articles        1 ──── ∞   article_set_links
articles        0..1 ── 1  sets               (linked_set)

inventory_items 1 ──── ∞   inventory_purchases
inventory_items 1 ──── ∞   inventory_photos
```

---

## localStorage → PostgreSQL (маппинг)

| localStorage key | Таблица в PostgreSQL |
|---|---|
| `ss_auth` / `ss_username` | `users` |
| `ss_theme` / `ss_sidebar` | `users.theme` / `users.sidebar_collapsed` |
| `ss_finance` | `user_finance` |
| `ss_envelopes` | `envelopes` |
| `ss_inventory_extra` | `inventory_items` + `inventory_purchases` + `inventory_photos` |
| `ss_catalog_likes` / `ss_catalog_dislikes` | `reactions` (target_type='set') |
| `ss_article_sets` | `article_set_links` |
