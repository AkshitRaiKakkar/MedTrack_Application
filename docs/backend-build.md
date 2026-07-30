# Building the MedTrack backend

This document describes how to build the Spring Boot backend locally, and records the class of
build failure that motivated `SourceLayoutConventionTest`.

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| JDK | 17 or newer | `pom.xml` targets `<java.version>17</java.version>`; the build has been verified on Temurin 17 and Temurin 26. |
| Maven | none required | Use the checked-in wrapper (`./mvnw`). It provisions Maven 3.6.3 on first run. |
| Network | required on first build | Spring Boot 4.1.0 and its dependency tree are downloaded into `~/.m2/repository`. |

## Commands

```bash
cd Backend

./mvnw -B -ntp -DskipTests compile   # compile only
./mvnw -B -ntp test                  # unit + integration tests
./mvnw -B -ntp verify                # full build, produces target/medtrack-backend-1.0.0.jar
```

The first build downloads a few hundred megabytes of dependencies and takes several minutes.
Subsequent builds resolve from the local repository. Add `-o` to force fully offline resolution.

### Running the application

`app.jwt.secret` has no default. `JwtUtil` validates it at startup and fails fast if it is missing
or shorter than 32 characters, so the variable must be exported before the application will boot:

```bash
export JWT_SECRET="$(head -c 48 /dev/urandom | base64)"
./mvnw -B -ntp spring-boot:run
```

With no `DATABASE_URL` set, the application uses an in-memory H2 database and `DataInitializer`
seeds the demo hospital, technician and supplier accounts documented in the README.

## The `mvnw` permission bit

`Backend/mvnw` must be committed with mode `100755`. It was previously committed as `100644`, so a
fresh clone produced:

```
$ ./mvnw -DskipTests compile
zsh: permission denied: ./mvnw
```

If you ever need to restore it:

```bash
git update-index --chmod=+x Backend/mvnw
```

## Why `SourceLayoutConventionTest` exists

`Backend/src/test/java/com/medtrack/architecture/SourceLayoutConventionTest.java` asserts four
properties of every file under `src/main/java`:

1. exactly one `package` declaration,
2. the declared package matches the directory,
3. a public top-level type's name matches its file name,
4. everything lives under `com.medtrack`.

These look like style rules. They are not — they are build-availability rules.

`javac` validates all four during the **enter** phase, which runs *before* annotation processing.
When any of them is violated, javac abandons the compilation round. Lombok is an annotation
processor, so it never runs, so no `@Data` getter, `@Builder` builder or `@RequiredArgsConstructor`
constructor is generated anywhere in the module.

The observable result is wildly disproportionate to the cause. Two defects —

- a duplicated `package` line in `auth/commandcenter/model/SecurityUnifiedAlert.java`, and
- `package com.medtrack.specification` / `class EquipmentSpecification` in
  `specifications/EquipmentSpecifications.java`

— produced **over 400 compiler errors**, almost all of them of the form:

```
[ERROR] .../auth/authority/service/AuthorityService.java:[57,31] cannot find symbol
  symbol:   method getAuthorityVersion()
  location: variable user of type com.medtrack.auth.model.User
[ERROR] .../auth/commandcenter/service/SecurityCommandCenterService.java:[34,77] cannot find symbol
  symbol:   method builder()
  location: class ...model.SecurityCommandCenterConfig
```

Every one of those files was healthy. `User` really does carry `@Data`; `SecurityCommandCenterConfig`
really does carry `@Builder`. Chasing them individually is wasted effort, and the two real defects
are buried on page one of a 400-line log.

The convention test fails fast and names the two offending files directly, which is the difference
between a five-minute fix and an afternoon.

### Diagnosing a similar failure in future

If you see a flood of `cannot find symbol` errors naming Lombok-generated members, do **not** start
adding accessors by hand. Look for the first structural error in the log instead:

```bash
./mvnw -B -ntp -DskipTests compile 2>&1 \
  | grep -E "class, interface, enum, or record expected|should be declared in a file named|is already defined"
```

Fix those, then recompile. The `cannot find symbol` wave will disappear on its own.
