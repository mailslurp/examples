# Java Jakarta Mail email example

Install maven:

```shell
brew install maven
```

Setup a new project:

```shell
mvn archetype:generate -DarchetypeGroupId=org.apache.maven.archetypes -DarchetypeArtifactId=maven-archetype-quickstart -DarchetypeVersion=1.4
```

Add Jakarta mail [dependency](https://mvnrepository.com/artifact/jakarta.mail/jakarta.mail-api) then run:

```shell
mvn dependency:resolve
```
