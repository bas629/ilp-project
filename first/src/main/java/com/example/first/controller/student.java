package com.example.first.controller;

import com.example.first.Dto.createStudentDto;
import com.example.first.Dto.studentDto;
import com.example.first.service.service;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class student {
    private final service service;

    @GetMapping("/student")
  public List<studentDto> getStudentData()
  {
      return   service.getAllStudent();

  }
  @GetMapping("/student/{id}")
  public studentDto getStudentById(@PathVariable Long id)
  {
      return service.findById(id);
  }

  @PostMapping("/student")
   public  studentDto createStudent(@RequestBody createStudentDto addStudent )
  {
    return service.createdNewStudent(addStudent);

  }


    @PatchMapping("/student/{id}")
    public studentDto upgradeStudent(@RequestBody Map<String, Object>  addStudent,@PathVariable Long id)
    {
        return  service.updatedStudent(id , addStudent);

    }




}

