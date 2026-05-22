# Selorah Health - Architecture Diagrams & Flowcharts

**Document Version**: 1.0.0  
**Last Updated**: May 2026  
**Audience**: Technical Architects, Developers

> This document contains visual representations of the Selorah Health system architecture using flowcharts and sequence diagrams.

---

## Table of Contents

1. [System Overview Diagram](#system-overview-diagram)
2. [Data Flow Architecture](#data-flow-architecture)
3. [User Authentication Flow](#user-authentication-flow)
4. [Medical Record Sharing Flow](#medical-record-sharing-flow)
5. [QR Code Access Control Flow](#qr-code-access-control-flow)
6. [Real-time Synchronization Architecture](#real-time-synchronization-architecture)
7. [Component Interaction Diagram](#component-interaction-diagram)
8. [Database Schema Relationships](#database-schema-relationships)
9. [Deployment Architecture](#deployment-architecture)
10. [API Request Flow](#api-request-flow)

---

## System Overview Diagram

```mermaid
graph TB
    subgraph Client["Client Layer"]
        direction LR
        PatientApp["Patient Portal<br/>(React SPA)"]
        ProviderApp["Provider Portal<br/>(React SPA)"]
        ResearcherApp["Researcher Portal<br/>(React SPA)"]
    end

    subgraph CDN["Content Delivery Network"]
        direction LR
        Edge["Vercel Edge Network<br/>(100+ Locations)"]
    end

    subgraph API["API & Gateway Layer"]
        direction LR
        LB["Load Balancer"]
        API1["Express Backend 1"]
        API2["Express Backend 2"]
        API3["Express Backend N"]
    end

    subgraph Services["Services Layer"]
        direction LR
        Auth["Authentication<br/>Service"]
        Records["Medical Records<br/>Service"]
        Access["Access Control<br/>Service"]
        Socket["Real-time<br/>Service"]
    end

    subgraph Data["Data Layer"]
        direction LR
        Supabase["Supabase PostgreSQL<br/>Database"]
        RLS["Row-Level Security<br/>Policies"]
    end

    subgraph Blockchain["Blockchain Layer"]
        direction LR
        Monad["Monad Testnet<br/>Network"]
        Contract["Smart Contracts<br/>(AccessControl)"]
    end

    Client -->|HTTPS/WSS| CDN
    CDN -->|Route to| API
    API -->|Process| Services
    Services -->|Query| Data
    Services -->|Verify| Blockchain
    Data -->|RLS Applied| Supabase
    Blockchain -->|Deploy to| Monad

    style Client fill:#e1f5ff
    style CDN fill:#f3e5f5
    style API fill:#e8f5e9
    style Services fill:#fff3e0
    style Data fill:#fce4ec
    style Blockchain fill:#f1f8e9
```

---

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant User as User<br/>(Browser)
    participant Frontend as Frontend<br/>(React)
    participant Backend as Backend<br/>(Express)
    participant Supabase as Supabase<br/>(DB + Auth)
    participant Blockchain as Blockchain<br/>(Smart Contracts)

    User->>Frontend: 1. Request Medical Record
    Frontend->>Backend: 2. GET /api/records/123<br/>(with Auth Token)
    Backend->>Supabase: 3. Query from DB<br/>with RLS applied
    Supabase-->>Backend: 4. Return Record (if authorized)
    Backend->>Blockchain: 5. Verify Access Token<br/>(QR expiry check)
    Blockchain-->>Backend: 6. Token Valid ✓
    Backend-->>Frontend: 7. Return Record Data
    Frontend-->>User: 8. Display Record<br/>in UI

    Note over Backend,Supabase: RLS Policy:<br/>user_id = auth.uid()
    Note over Backend,Blockchain: Time-bound<br/>verification
```

---

## User Authentication Flow

```mermaid
graph TD
    A["User Visits Application"] --> B{"Logged In?"}
    B -->|No| C["Redirect to Login/Signup"]
    B -->|Yes| D["Load Dashboard"]
    
    C --> E["User Enters Email/Phone"]
    E --> F["Supabase Auth Handles"]
    F --> G{"Email or Phone?"}
    
    G -->|Email| H["Send Verification Email"]
    G -->|Phone| I["Send WhatsApp OTP"]
    
    H --> J["User Clicks Link"]
    I --> K["User Enters OTP"]
    
    J --> L["Create Auth Session"]
    K --> L
    
    L --> M["Generate JWT Token"]
    M --> N["Store in Browser<br/>LocalStorage/Cookie"]
    
    N --> O["Redirect to Onboarding"]
    O --> P["User Selects Role<br/>patient/provider/researcher"]
    
    P --> Q["Submit Role Details"]
    Q --> R["Backend Creates Profile<br/>in Supabase"]
    
    R --> S["Generate Unique ID<br/>from PII"]
    S --> T["Update auth.uid()<br/>with Role"]
    
    T --> U["Redirect to Dashboard"]
    U --> V["Load User Portal"]
    
    style A fill:#e1f5ff
    style U fill:#c8e6c9
    style F fill:#fff3e0
```

---

## Medical Record Sharing Flow

```mermaid
graph LR
    subgraph Patient["Patient Action"]
        A["Patient Opens<br/>My Records"]
        B["Selects Record<br/>to Share"]
        C["Chooses Access<br/>Duration"]
    end

    subgraph Backend["Backend Processing"]
        D["Validate Patient<br/>Ownership"]
        E["Generate Unique<br/>Token"]
        F["Create QR Code<br/>with Token"]
        G["Store in DB<br/>with Expiry"]
    end

    subgraph Blockchain["Blockchain Verification"]
        H["Encode Token<br/>in Smart Contract"]
        I["Set Expiration<br/>Time"]
        J["Log Event"]
    end

    subgraph Provider["Provider Action"]
        K["Scan QR Code"]
        L["Extract Token"]
        M["Request Record<br/>with Token"]
    end

    subgraph Access["Access Verification"]
        N["Verify Token<br/>Valid"]
        O["Check Expiry<br/>Time"]
        P["RLS Policy Check<br/>user_id Match"]
        Q["Smart Contract<br/>Verification"]
    end

    subgraph Return["Return Data"]
        R["Log Access<br/>in access_logs"]
        S["Return Record<br/>to Provider"]
        T["Emit Socket Event<br/>to Patient"]
    end

    A --> B --> C --> D --> E --> F --> G
    G --> H --> I --> J
    K --> L --> M
    M --> N --> O --> P --> Q
    Q --> R --> S --> T

    style Patient fill:#e3f2fd
    style Backend fill:#f3e5f5
    style Blockchain fill:#f1f8e9
    style Provider fill:#fce4ec
    style Access fill:#fff3e0
    style Return fill:#c8e6c9
```

---

## QR Code Access Control Flow

```mermaid
graph TD
    A["Patient Generates<br/>QR Code"] -->|1. Frontend| B["Calls POST /api/auth/generate-qr"]
    
    B -->|2. Backend| C["Validate Ownership"]
    C -->|3. Backend| D["Generate Token:<br/>SHA256(record_id +<br/>timestamp + secret)"]
    
    D -->|4. Backend| E["Set Expiration:<br/>now() + TTL<br/>e.g., 72 hours"]
    E -->|5. Backend| F["Store in DB:<br/>qr_codes table"]
    
    F -->|6. Blockchain| G["Call Smart Contract:<br/>grantAccess()"]
    G -->|7. Blockchain| H["Emit Event:<br/>AccessGranted"]
    
    H -->|8. Frontend| I["Render QR Code:<br/>with Token"]
    I -->|9. Patient| J["Share QR<br/>with Provider"]
    
    J -->|10. Provider| K["Scan QR Code"]
    K -->|11. Provider| L["Extract Token<br/>from QR"]
    
    L -->|12. Backend| M["Validate Token:<br/>SELECT from qr_codes"]
    M -->|13. Verification| N{"Token<br/>Valid?"}
    
    N -->|Not Expired?| O{"Max Uses<br/>Not Reached?"}
    N -->|Expired| P["Return 401:<br/>Token Expired"]
    
    O -->|Not Revoked?| Q{"Blockchain<br/>Verify?"}
    O -->|Limit Reached| R["Return 403:<br/>Access Limit Reached"]
    
    Q -->|Call Contract:<br/>verifyAccess| S["Smart Contract<br/>Checks expiry"]
    S -->|Valid| T["Return Record<br/>to Provider"]
    
    Q -->|Invalid| U["Return 401:<br/>Unauthorized"]
    T -->|Log Access| V["INSERT to<br/>access_logs"]
    
    V -->|Emit Event| W["Socket.io<br/>Send to Patient:<br/>record:accessed"]
    W -->|Notify| X["Patient Sees<br/>Access Notification"]

    style A fill:#e3f2fd
    style N fill:#fff3e0
    style O fill:#fff3e0
    style Q fill:#fff3e0
    style T fill:#c8e6c9
    style P fill:#ffcdd2
    style R fill:#ffcdd2
    style U fill:#ffcdd2
```

---

## Real-time Synchronization Architecture

```mermaid
graph TD
    subgraph Client["Client: Patient Portal"]
        A["React Component<br/>useEffect()"]
        B["Socket.io Client<br/>Listener"]
    end

    subgraph Backend["Backend: Express + Socket.io"]
        C["Socket.io Server"]
        D["Supabase Realtime<br/>Listener"]
    end

    subgraph Database["Supabase"]
        E["PostgreSQL<br/>medical_records table"]
        F["Postgres Trigger<br/>on UPDATE"]
    end

    subgraph Other["Other Users"]
        G["Provider Updates<br/>Medical Record"]
    end

    G -->|1. API Call| H["PUT /api/records/123"]
    H -->|2. Update| E
    E -->|3. Fire Trigger| F
    F -->|4. Publish Event| D
    
    D -->|5. Receive Event| C
    C -->|6. Broadcast via<br/>Socket.io| B
    B -->|7. Update State| A
    A -->|8. Re-render| I["Updated Record<br/>Appears on Screen"]
    
    style A fill:#e3f2fd
    style I fill:#c8e6c9
    style D fill:#f3e5f5
```

**Key Technologies**:
- **Supabase Realtime**: PostgreSQL change listeners
- **Socket.io**: WebSocket for instant delivery
- **React useEffect**: Client-side state management
- **RLS Policies**: Ensure only authorized users receive updates

---

## Component Interaction Diagram

```mermaid
graph TB
    subgraph Frontend["Frontend Layer"]
        subgraph Pages["Pages"]
            P1["LandingPage"]
            P2["LoginPage"]
            P3["SignupPage"]
            P4["DashboardPage"]
            P5["RecordsPage"]
        end
        
        subgraph Components["Components"]
            C1["Header"]
            C2["Sidebar"]
            C3["RecordCard"]
            C4["QRModal"]
            C5["AccessLog"]
        end
        
        subgraph Context["Context"]
            L["LanguageContext"]
        end
        
        subgraph Services["Services"]
            S1["Supabase Client"]
            S2["Socket.io Client"]
        end
    end

    P4 --> C1
    P4 --> C2
    P4 --> C3
    C3 --> C4
    C3 --> C5
    
    C1 --> L
    C2 --> L
    
    P4 --> S1
    P5 --> S1
    P4 --> S2
    P5 --> S2

    style Frontend fill:#e3f2fd
    style Pages fill:#bbdefb
    style Components fill:#90caf9
    style Context fill:#64b5f6
    style Services fill:#42a5f5
```

---

## Database Schema Relationships

```mermaid
erDiagram
    AUTH_USERS ||--o{ PROFILES : "references"
    PROFILES ||--o{ MEDICAL_RECORDS : "owns"
    MEDICAL_RECORDS ||--o{ ACCESS_LOGS : "has"
    MEDICAL_RECORDS ||--o{ QR_CODES : "generates"
    PROFILES ||--o{ ACCESS_LOGS : "accesses_via"
    PROFILES ||--o{ QR_CODES : "creates"

    AUTH_USERS {
        uuid id PK
        string email UK
        string phone UK
        text encrypted_password
        timestamp last_sign_in_at
        timestamp created_at
    }

    PROFILES {
        uuid id PK
        uuid id_auth_users FK
        string role
        string first_name
        string last_name
        string phone_number UK
        date date_of_birth
        string gender
        boolean is_pro
        jsonb vitals
        jsonb allergies
        jsonb emergency_contacts
        string organization_name
        string license_number
        string kyc_status
        timestamp created_at
        timestamp updated_at
    }

    MEDICAL_RECORDS {
        uuid id PK
        uuid user_id FK
        string name
        string record_type
        date date
        string status
        text document_url
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }

    ACCESS_LOGS {
        uuid id PK
        uuid record_id FK
        uuid accessed_by FK
        string access_type
        inet ip_address
        text user_agent
        timestamp timestamp
        jsonb metadata
    }

    QR_CODES {
        uuid id PK
        uuid record_id FK
        uuid generated_by FK
        string token UK
        timestamp expires_at
        integer max_accesses
        integer current_accesses
        boolean revoked
        jsonb accessed_by
        timestamp created_at
    }
```

---

## Deployment Architecture

```mermaid
graph LR
    subgraph Dev["Development"]
        D1["GitHub Repository"]
        D2["Local Dev Environment"]
    end

    subgraph Build["Build Pipeline"]
        B1["CI/CD Trigger"]
        B2["Code Compile"]
        B3["Tests Run"]
        B4["Build Artifacts"]
    end

    subgraph Frontend_Deploy["Frontend Deployment"]
        F1["Vercel"]
        F2["Edge Network"]
        F3["Global CDN<br/>100+ Locations"]
    end

    subgraph Backend_Deploy["Backend Deployment"]
        BK1["Docker Container"]
        BK2["Railway/Heroku/AWS"]
        BK3["Auto Scaling<br/>2-N Instances"]
    end

    subgraph Database["Database"]
        DB1["Supabase Cluster"]
        DB2["Automated Backups<br/>Daily"]
        DB3["Read Replica<br/>Standby"]
    end

    subgraph Blockchain["Blockchain"]
        BC1["Monad Testnet"]
        BC2["Smart Contracts<br/>Deployed"]
    end

    D1 --> B1
    D2 --> D1
    
    B1 --> B2 --> B3 --> B4
    
    B4 --> F1 --> F2 --> F3
    B4 --> BK1 --> BK2 --> BK3
    
    F3 -.->|API Calls| BK3
    BK3 -->|Queries| DB1
    DB1 -->|Replicates| DB2
    DB1 -->|Standby| DB3
    
    BK3 -->|Deploy| BC1
    BC1 --> BC2

    style Dev fill:#e3f2fd
    style Build fill:#fff3e0
    style Frontend_Deploy fill:#f3e5f5
    style Backend_Deploy fill:#e8f5e9
    style Database fill:#fce4ec
    style Blockchain fill:#f1f8e9
```

---

## API Request Flow

```mermaid
sequenceDiagram
    participant Browser as Browser
    participant Frontend as React SPA
    participant CDN as Vercel CDN
    participant LB as Load Balancer
    participant Backend as Express Server
    participant Middleware as Middleware Stack
    participant Route as Route Handler
    participant Service as Service Layer
    participant DB as Supabase DB
    participant Response as Response

    Browser->>Frontend: 1. User Action<br/>(e.g., fetch records)
    Frontend->>CDN: 2. API Request<br/>GET /api/records<br/>Authorization: Bearer token
    CDN->>LB: 3. Route Request<br/>to Backend
    LB->>Backend: 4. Forward Request
    
    Backend->>Middleware: 5. Process Middleware
    Middleware->>Middleware: 5a. CORS Check
    Middleware->>Middleware: 5b. JSON Parse
    Middleware->>Middleware: 5c. Auth Verify
    Middleware->>Middleware: 5d. Compression
    
    Middleware->>Route: 6. Request Valid<br/>Proceed to Route
    Route->>Service: 7. Call Service<br/>getRecords(userId)
    
    Service->>DB: 8. Query Database<br/>SELECT * FROM medical_records<br/>WHERE user_id = auth.uid()
    
    DB->>DB: 9. Apply RLS Policy<br/>row_security_policy()
    DB->>Response: 10. Return Filtered<br/>Records
    
    Response->>Service: 11. Format Response<br/>Transform Data
    Service->>Route: 12. Return JSON
    Route->>Backend: 13. Send Response
    Backend->>Middleware: 14. Compression<br/>gzip/brotli
    Backend->>CDN: 15. HTTP 200<br/>Compressed Response
    CDN->>Frontend: 16. Deliver Response
    Frontend->>Browser: 17. Update State<br/>Re-render UI
    
    note over Backend,Service: Average: 50-200ms
    note over DB: RLS enforces<br/>row-level security
```

---

## Authentication & Authorization Layers

```mermaid
graph TB
    subgraph Layer1["Layer 1: Application"]
        A["Client Makes<br/>API Request"]
        A -->|Include JWT| B["Authorization:<br/>Bearer {token}"]
    end

    subgraph Layer2["Layer 2: Transport"]
        B -->|HTTPS/WSS| C["TLS Encryption"]
        C -->|Verify Cert| D{"Certificate<br/>Valid?"}
        D -->|No| E["Reject Connection"]
        D -->|Yes| F["Proceed"]
    end

    subgraph Layer3["Layer 3: Express Middleware"]
        F -->|Parse Token| G["Verify JWT<br/>Signature"]
        G -->|Supabase.auth| H{"Token<br/>Valid?"}
        H -->|Expired| I["Return 401<br/>Unauthorized"]
        H -->|Invalid| J["Return 401<br/>Invalid Token"]
        H -->|Valid| K["Extract user_id<br/>& Role"]
    end

    subgraph Layer4["Layer 4: Database"]
        K -->|Query| L["SELECT * FROM<br/>medical_records<br/>WHERE user_id = {id}"]
        L -->|Apply Policy| M["RLS Policy:<br/>auth.uid() = id"]
        M -->|Check Role| N{"Role<br/>Permitted?"}
        N -->|No| O["Return Empty<br/>Result Set"]
        N -->|Yes| P["Return Rows"]
    end

    subgraph Layer5["Layer 5: Blockchain"]
        K -->|For Sensitive Ops| Q["Verify QR Token<br/>on Smart Contract"]
        Q -->|Check Expiry| R{"Token<br/>Expired?"}
        R -->|Yes| S["Contract:<br/>AccessExpired()"]
        R -->|No| T["Contract:<br/>AccessGranted()"]
    end

    E --> End["Access Denied"]
    I --> End
    J --> End
    O --> End
    S --> End
    P --> OK["Access Granted"]
    T --> OK

    style Layer1 fill:#e3f2fd
    style Layer2 fill:#f3e5f5
    style Layer3 fill:#fff3e0
    style Layer4 fill:#e8f5e9
    style Layer5 fill:#f1f8e9
    style End fill:#ffcdd2
    style OK fill:#c8e6c9
```

---

## Conclusion

These diagrams provide a comprehensive visual representation of:

✅ **System Architecture** - How components interact  
✅ **Data Flow** - How information moves through the system  
✅ **Authentication** - Multi-layer security model  
✅ **Real-time Features** - WebSocket-based synchronization  
✅ **Deployment** - Production deployment architecture  
✅ **Database** - Schema relationships and structure  

For more details, refer to [architecture.md](architecture.md) and [README.md](README.md).
