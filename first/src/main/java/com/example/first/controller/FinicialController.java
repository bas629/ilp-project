package com.example.first.controller;


import com.example.first.Dto.*;
import com.example.first.entity.GoalTacker;
import com.example.first.entity.Stock;
import com.example.first.repo.ExpenseRepo;
import com.example.first.service.service;
import lombok.RequiredArgsConstructor;
import org.springframework.data.repository.query.Param;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
public class FinicialController {

    private final service service;
    private  final  ExpenseRepo expenseRepo;

    @PostMapping("/user")
    public UserDto createStudent(@RequestBody UserDto addStudent )
    {
        return service.createdNewUser(addStudent);

    }

    @PostMapping("/login")
    public LoginResponseDto login(@RequestBody LoginDto dto) {

        return service.loginUser(dto);
    }


    @PostMapping("/AddExpanse")
    public ExpanseDto createStudent(@RequestBody ExpanseDto dto) throws Exception {
        return service.createExpanse(dto);


    }

    @PostMapping("/investment")
    public InvestmentDto investment (@RequestBody InvestmentDto dto) throws Exception {
        return service.Investment(dto);


    }

    @PostMapping("/Stock")
    public void Stock (@RequestBody ExpanseDto dto) throws Exception {
        service.StockAdd(dto);


    }
    @GetMapping("/total")
    public Optional<Double> getTotalByCategory(@RequestParam Long id,
                                               @RequestParam String category)
    {
        return expenseRepo.getTotalByCategory(id,category);
    }


    
    @PostMapping("/buyStock")
    public void BuyStock (@RequestBody ExpanseDto ex) throws Exception {



    }
    @PatchMapping("/sellStock")
    public void sellStock (@RequestBody ExpanseDto ex) throws Exception {



    }


    @PostMapping("/addGoal")
    public GoalTacker addGoal(@RequestBody GoalTrackerDto ex)  throws Exception
    {
        return  service.addGoal(ex);


    }

    @GetMapping("/getGoal")
    public  GetGoalTackerDto getGoal(@RequestParam Long id ) throws Exception
    {
        return service.getGoalTracker(id);

    }

    @GetMapping("/StockRisk")
    public List<Stock> getStockByRisk(@RequestParam int risk)
            throws Exception {

        return service.getStockByRisk(risk);
    }








}
