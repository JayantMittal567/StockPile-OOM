package com.stockpile;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.io.File;

@SpringBootApplication
public class StockpileApplication {

    public static void main(String[] args) {
        // Resolve database location: if started from project root where backend/stockpile.db exists,
        // ensure the authoritative database is loaded rather than creating or loading a separate root file.
        String explicitUrl = System.getProperty("spring.datasource.url");
        if (explicitUrl == null) {
            explicitUrl = System.getenv("SPRING_DATASOURCE_URL");
        }
        if (explicitUrl == null) {
            File backendDb = new File("backend/stockpile.db");
            if (backendDb.exists()) {
                System.setProperty("spring.datasource.url", "jdbc:sqlite:backend/stockpile.db");
            }
        }

        SpringApplication.run(StockpileApplication.class, args);
    }
}
