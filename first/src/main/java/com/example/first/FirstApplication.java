package com.example.first;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FirstApplication {

	public static void main(String[] args){


	SpringApplication.run(FirstApplication.class, args);
	}

}
