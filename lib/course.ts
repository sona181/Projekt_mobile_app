import { Course } from './types';
import javaBasics from '../data/courses/java-basics.json';
import pythonBasics from '../data/courses/python-basics.json';
import cBasics from '../data/courses/c-basics.json';

const courses: Record<string, Course> = {
  'java-basics': javaBasics as Course,
  'python-basics': pythonBasics as Course,
  'c-basics': cBasics as Course,
};

export function getCourse(slug: string): Course | null {
  return courses[slug] ?? null;
}

export function getAllCourses(): Course[] {
  return Object.values(courses);
}
